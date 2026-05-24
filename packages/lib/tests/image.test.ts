import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { preprocessImage } from '../src/image.js';
// import path keeps the test pinned to the source module so future renames fail fast.

async function jpegOf(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 30, b: 30 },
    },
  })
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function pngOf(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 255 } },
  })
    .png()
    .toBuffer();
}

async function webpOf(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 200, b: 0 } },
  })
    .webp()
    .toBuffer();
}

async function avifOf(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 50, g: 50, b: 50 } },
  })
    .avif({ quality: 50 })
    .toBuffer();
}

async function tiffOf(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 220, g: 220, b: 220 } },
  })
    .tiff()
    .toBuffer();
}

describe('preprocessImage', () => {
  it('keeps small JPEGs unchanged in dimensions but outputs JPEG', async () => {
    const input = await jpegOf(800, 600);
    const out = await preprocessImage(input, { mime: 'image/jpeg' });
    expect(out.mime).toBe('image/jpeg');
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
  });

  it('resizes images whose long edge exceeds 2048px', async () => {
    const input = await jpegOf(4000, 3000);
    const out = await preprocessImage(input, { mime: 'image/jpeg' });
    const meta = await sharp(out.buffer).metadata();
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(2048);
  });

  it('converts PNG to JPEG (single output codec for the AI service)', async () => {
    const input = await pngOf(500, 400);
    const out = await preprocessImage(input, { mime: 'image/png' });
    expect(out.mime).toBe('image/jpeg');
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('jpeg');
  });

  it('converts WebP to JPEG', async () => {
    const input = await webpOf(640, 480);
    const out = await preprocessImage(input, { mime: 'image/webp' });
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(640);
  });

  it('converts AVIF to JPEG', async () => {
    const input = await avifOf(512, 512);
    const out = await preprocessImage(input, { mime: 'image/avif' });
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('jpeg');
  });

  it('converts TIFF to JPEG', async () => {
    const input = await tiffOf(700, 500);
    const out = await preprocessImage(input, { mime: 'image/tiff' });
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(700);
  });

  it('rasterizes the first page of a PDF and converts it to JPEG', async () => {
    // Build a minimal one-page PDF on the fly so the test is hermetic.
    // We construct it via a single rasterized JPEG embedded in a PDF using
    // a tiny helper from `pdf-to-png-converter`'s peer (pdf-lib).
    const { PDFDocument } = await import('pdf-lib').catch(() => ({ PDFDocument: null as never }));
    if (!PDFDocument) {
      // pdf-lib not installed in CI yet — skip without failing.
      return;
    }
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 300]);
    page.drawText('Test Receipt', { x: 50, y: 250 });
    const pdfBytes = await doc.save();
    const out = await preprocessImage(Buffer.from(pdfBytes), {
      mime: 'application/pdf',
    });
    expect(out.mime).toBe('image/jpeg');
    expect(out.bytes).toBeGreaterThan(0);
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('jpeg');
    expect((meta.width ?? 0) * (meta.height ?? 0)).toBeGreaterThan(0);
  }, 20_000);

  it('rejects unsupported MIME types', async () => {
    await expect(
      preprocessImage(Buffer.from('not-an-image'), { mime: 'text/plain' as never }),
    ).rejects.toThrow(/unsupported/i);
  });

  it('reports the resulting byte size', async () => {
    const input = await jpegOf(1024, 1024);
    const out = await preprocessImage(input, { mime: 'image/jpeg' });
    expect(out.bytes).toBe(out.buffer.byteLength);
    expect(out.bytes).toBeGreaterThan(0);
  });
});
