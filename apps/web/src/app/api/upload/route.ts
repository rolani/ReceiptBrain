import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@receiptbrain/lib';
import { toApiErrorResponse, requireSession } from '@/lib/require-session';
import { validateUpload } from '@/lib/upload-validation';
import { assertUploadWithinLimit } from '@/lib/rate-limit';
import { extractReceiptQueue, storage } from '@/lib/services';
import { enqueueExtractReceipt } from '@receiptbrain/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireSession();
    await assertUploadWithinLimit(session.user.id);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'bad_request', message: 'file field is required' }, { status: 400 });
    }

    const check = validateUpload(file);
    if (!check.ok) {
      return NextResponse.json({ error: 'bad_request', reason: check.reason, message: check.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3 = storage();
    const imageHash = s3.contentHash(buffer);

    const existing = await prisma.receipt.findUnique({
      where: { userId_imageHash: { userId: session.user.id, imageHash } },
    });

    const key = `receipts/${session.user.id}/${imageHash}`;

    // Active duplicate — same image already on file for this user.
    if (existing && !existing.deletedAt) {
      return NextResponse.json(
        { receiptId: existing.id, status: existing.status, jobId: existing.id, deduped: true },
        { status: 200 },
      );
    }

    // Soft-deleted duplicate — restore the row and re-run extraction.
    if (existing?.deletedAt) {
      await s3.putObject(key, buffer, check.mime);
      const restored = await prisma.receipt.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          status: 'uploaded',
          imageUrl: key,
          imageMime: check.mime,
          imageBytes: check.bytes,
        },
      });
      const queue = extractReceiptQueue();
      const job = await enqueueExtractReceipt(queue, {
        receiptId: restored.id,
        userId: session.user.id,
      });
      return NextResponse.json(
        { receiptId: restored.id, status: restored.status, jobId: job.id, deduped: false, restored: true },
        { status: 202 },
      );
    }

    await s3.putObject(key, buffer, check.mime);

    const receipt = await prisma.receipt.create({
      data: {
        userId: session.user.id,
        imageUrl: key,
        imageHash,
        imageMime: check.mime,
        imageBytes: check.bytes,
        status: 'uploaded',
      },
    });

    const queue = extractReceiptQueue();
    const job = await enqueueExtractReceipt(queue, {
      receiptId: receipt.id,
      userId: session.user.id,
    });

    return NextResponse.json(
      { receiptId: receipt.id, status: receipt.status, jobId: job.id, deduped: false },
      { status: 202 },
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
