// Job handler for `extract_receipt` queue.
// Idempotent: receiving the same receiptId twice will overwrite items but is
// safe (DELETE then CREATE in a transaction). Low-confidence extractions are
// flagged `needs_review` rather than `extracted` so the UI can prompt the user.

import type { PrismaClient } from '@receiptbrain/lib/prisma';
import type { Storage } from '@receiptbrain/lib/storage';
import type { ExtractReceiptJob, GenerateInsightsQueueLike } from '@receiptbrain/lib/queue';
import { enqueueGenerateInsights } from '@receiptbrain/lib/queue';
import { preprocessImage, type SupportedInputMime } from '@receiptbrain/lib/image';
import type { AiClient, ExtractResult } from '../ai-client.js';
import { REVIEW_CONFIDENCE_THRESHOLD } from '@receiptbrain/lib/domain';

export const LOW_CONFIDENCE_THRESHOLD = REVIEW_CONFIDENCE_THRESHOLD;

// Defensive date parser — the AI service is supposed to return ISO 8601 but
// occasionally returns "Unknown", a date-only string, or an empty string.
// Returns null instead of throwing or producing an `Invalid Date` that Prisma
// would reject.
export function safeParseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

// A minimal logger surface that pino's Logger satisfies — we accept it via
// duck-typing so tests can inject a plain object.
type LoggerLike = {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export interface ExtractDeps {
  prisma: PrismaClient;
  storage: Storage;
  ai: AiClient;
  /**
   * Optional. When provided, a successful extraction (status='extracted' or
   * 'needs_review') auto-enqueues a debounced `generate_insights` job so
   * insights regenerate without the user clicking anything.
   */
  insightsQueue?: GenerateInsightsQueueLike;
  logger?: unknown;
}

export interface ExtractOutcome {
  status: 'extracted' | 'needs_review';
  extracted: ExtractResult;
}

export async function handleExtractReceipt(
  job: ExtractReceiptJob,
  deps: ExtractDeps,
): Promise<ExtractOutcome> {
  const { prisma, storage, ai, logger } = deps;
  const receipt = await prisma.receipt.findUnique({ where: { id: job.receiptId } });
  if (!receipt) throw new Error(`extract_receipt: receipt ${job.receiptId} not found`);
  if (receipt.userId !== job.userId) {
    throw new Error('extract_receipt: receipt userId mismatch — possible cross-tenant job');
  }

  await prisma.receipt.update({
    where: { id: receipt.id },
    data: { status: 'extracting' },
  });

  let extracted: ExtractResult;
  try {
    const raw = await storage.getObject(receipt.imageUrl);
    const preprocessed = await preprocessImage(raw, {
      mime: receipt.imageMime as SupportedInputMime,
    });
    extracted = await ai.extract(preprocessed.buffer);
  } catch (err) {
    await prisma.extractionAttempt.create({
      data: {
        receiptId: receipt.id,
        modelName: 'unknown',
        promptVersion: 'unknown',
        rawJson: { error: String(err) },
        status: 'failed',
        errorMessage: String(err),
      },
    });
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { status: 'failed' },
    });
    throw err;
  }

  const merchantConfidence = extracted.fieldConfidence.merchant ?? 0;
  const totalConfidence = extracted.fieldConfidence.total ?? 0;
  const purchasedAt = safeParseDate(extracted.purchasedAt);
  const needsReview =
    merchantConfidence < LOW_CONFIDENCE_THRESHOLD ||
    totalConfidence < LOW_CONFIDENCE_THRESHOLD ||
    purchasedAt === null;
  const status: ExtractOutcome['status'] = needsReview ? 'needs_review' : 'extracted';

  try {
    await prisma.$transaction(async (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => {
      const merchant = await tx.merchant.upsert({
        where: { canonicalName: extracted.merchant },
        update: {},
        create: { canonicalName: extracted.merchant },
      });

      await tx.item.deleteMany({ where: { receiptId: receipt.id } });
      if (extracted.items.length > 0) {
        await tx.item.createMany({
          data: extracted.items.map((it, idx) => ({
            receiptId: receipt.id,
            lineNumber: idx + 1,
            name: it.name,
            unitPrice: it.unitPrice.toFixed(2),
            quantity: it.quantity,
            lineTotal: it.lineTotal.toFixed(2),
            category: (it.category as
              | 'groceries'
              | 'dining'
              | 'transport'
              | 'software'
              | 'entertainment'
              | 'utilities'
              | 'household'
              | 'health'
              | 'travel'
              | 'other'
              | null) ?? null,
            confidence: it.confidence ?? null,
          })),
        });
      }

      await tx.receipt.update({
        where: { id: receipt.id },
        data: {
          status,
          merchantId: merchant.id,
          rawMerchant: extracted.rawMerchant ?? extracted.merchant,
          total: extracted.total.toFixed(2),
          subtotal: extracted.subtotal?.toFixed(2),
          tax: extracted.tax?.toFixed(2),
          tip: extracted.tip?.toFixed(2),
          currency: extracted.currency,
          purchasedAt,
          paymentLast4: extracted.paymentLast4 ?? null,
          fieldConfidence: extracted.fieldConfidence as unknown as object,
        },
      });

      await tx.extractionAttempt.create({
        data: {
          receiptId: receipt.id,
          modelName: extracted.model,
          promptVersion: extracted.promptVersion,
          rawJson: extracted as unknown as object,
          status: needsReview ? 'partial' : 'success',
          promptTokens: extracted.usage.promptTokens,
          completionTokens: extracted.usage.completionTokens,
          costUsdEstimate: extracted.usage.costUsdEstimate.toFixed(4),
        },
      });
    });
  } catch (err) {
    // AI succeeded but persistence failed — do not leave the receipt stuck in
    // `extracting` (the common case before safeParseDate was the Invalid Date
    // on purchasedAt).
    await prisma.extractionAttempt.create({
      data: {
        receiptId: receipt.id,
        modelName: extracted.model,
        promptVersion: extracted.promptVersion,
        rawJson: { error: String(err), extracted: extracted as unknown as object },
        status: 'failed',
        errorMessage: String(err),
      },
    });
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { status: 'failed' },
    });
    throw err;
  }

  if (deps.insightsQueue) {
    try {
      const result = await enqueueGenerateInsights(deps.insightsQueue, {
        userId: receipt.userId,
      });
      (logger as LoggerLike | undefined)?.info?.(
        { userId: receipt.userId, debounced: result.debounced },
        'insights:auto-enqueue',
      );
    } catch (err) {
      // Auto-enqueue failures must not break the extract job.
      (logger as LoggerLike | undefined)?.error?.(
        { userId: receipt.userId, err: String(err) },
        'insights:auto-enqueue failed',
      );
    }
  }

  (logger as LoggerLike | undefined)?.info?.(
    { receiptId: receipt.id, status, needsReview },
    'extract_receipt complete',
  );
  return { status, extracted };
}
