import { z } from 'zod';
import { CurrencyCodeSchema, MoneySchema } from './primitives.js';
import { ItemCategory, ReceiptStatus } from './enums.js';

export const ExtractedItemSchema = z.object({
  name: z.string().min(1),
  unitPrice: MoneySchema,
  quantity: z.number().int().min(1).default(1),
  lineTotal: MoneySchema,
  category: ItemCategory.optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;

export const FieldConfidenceSchema = z.object({
  merchant: z.number().min(0).max(1).optional(),
  total: z.number().min(0).max(1).optional(),
  purchasedAt: z.number().min(0).max(1).optional(),
  items: z.number().min(0).max(1).optional(),
});
export type FieldConfidence = z.infer<typeof FieldConfidenceSchema>;

export const UsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  costUsdEstimate: z.number().nonnegative(),
});
export type Usage = z.infer<typeof UsageSchema>;

export const ExtractResponseSchema = z.object({
  merchant: z.string().min(1),
  rawMerchant: z.string().optional(),
  currency: CurrencyCodeSchema,
  subtotal: MoneySchema.optional(),
  tax: MoneySchema.optional(),
  tip: MoneySchema.optional(),
  total: MoneySchema,
  purchasedAt: z.string().datetime(),
  paymentLast4: z.string().regex(/^\d{4}$/).optional(),
  items: z.array(ExtractedItemSchema),
  fieldConfidence: FieldConfidenceSchema,
  model: z.string(),
  promptVersion: z.string(),
  usage: UsageSchema,
});
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;

export const ReceiptSummarySchema = z.object({
  id: z.string(),
  status: ReceiptStatus,
  merchant: z.string().nullable(),
  total: MoneySchema.nullable(),
  currency: CurrencyCodeSchema.nullable(),
  purchasedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type ReceiptSummary = z.infer<typeof ReceiptSummarySchema>;

export const UploadResponseSchema = z.object({
  receiptId: z.string(),
  status: ReceiptStatus,
  jobId: z.string(),
  deduped: z.boolean().default(false),
});
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const ReceiptCorrectionSchema = z.object({
  rawMerchant: z.string().min(1).max(200).optional(),
  total: MoneySchema.optional(),
  subtotal: MoneySchema.optional(),
  tax: MoneySchema.optional(),
  tip: MoneySchema.optional(),
  currency: CurrencyCodeSchema.optional(),
  purchasedAt: z.string().datetime().optional(),
  status: ReceiptStatus.optional(),
  items: z
    .array(
      z.object({
        lineNumber: z.number().int().min(1),
        name: z.string().min(1).max(200),
        unitPrice: MoneySchema,
        quantity: z.number().int().min(1),
        lineTotal: MoneySchema,
      }),
    )
    .optional(),
});
export type ReceiptCorrection = z.infer<typeof ReceiptCorrectionSchema>;

export const ReceiptListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  merchant: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type ReceiptListQuery = z.infer<typeof ReceiptListQuerySchema>;
