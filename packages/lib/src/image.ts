import sharp from 'sharp';

export const SUPPORTED_INPUT_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/gif',
  'application/pdf',
] as const;

export type SupportedInputMime = (typeof SUPPORTED_INPUT_MIMES)[number];

export const MAX_LONG_EDGE_PX = 2048;
export const OUTPUT_JPEG_QUALITY = 85;

export interface PreprocessOptions {
  mime: SupportedInputMime;
  maxLongEdgePx?: number;
  quality?: number;
}

export interface PreprocessedImage {
  buffer: Buffer;
  mime: 'image/jpeg';
  bytes: number;
  width: number;
  height: number;
}

function isSupportedMime(mime: string): mime is SupportedInputMime {
  return (SUPPORTED_INPUT_MIMES as readonly string[]).includes(mime);
}

/**
 * Normalize any user-uploaded receipt into a JPEG ≤ MAX_LONG_EDGE_PX so that the
 * downstream AI service sees a single codec and bounded payload size.
 *
 * - JPEG/PNG/WebP/AVIF/TIFF/GIF/HEIC/HEIF → JPEG via sharp
 *   (auto-orients EXIF rotation, drops alpha, drops extra GIF/TIFF frames).
 * - PDF → first page is rasterized at 2x scale via `pdf-to-png-converter`
 *   then piped through the same sharp pipeline.
 */
export async function preprocessImage(
  input: Buffer,
  options: PreprocessOptions,
): Promise<PreprocessedImage> {
  if (!isSupportedMime(options.mime)) {
    throw new Error(`preprocessImage: unsupported mime "${options.mime}"`);
  }

  const maxLongEdge = options.maxLongEdgePx ?? MAX_LONG_EDGE_PX;
  const quality = options.quality ?? OUTPUT_JPEG_QUALITY;

  // PDF path: rasterize page 1 to PNG, then fall through to the normal pipeline.
  let rasterInput = input;
  if (options.mime === 'application/pdf') {
    const { pdfToPng } = await import('pdf-to-png-converter');
    const pages = await pdfToPng(input, {
      viewportScale: 2,
      pagesToProcess: [1],
    });
    const firstPage = pages[0];
    if (!firstPage?.content) {
      throw new Error('preprocessImage: PDF contained no rasterizable pages');
    }
    rasterInput = firstPage.content;
  }

  let pipeline = sharp(rasterInput, { failOn: 'none', pages: 1 }).rotate();
  const meta = await pipeline.metadata();
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longEdge > maxLongEdge) {
    pipeline = pipeline.resize({
      width: maxLongEdge,
      height: maxLongEdge,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
  const outMeta = await sharp(buffer).metadata();
  return {
    buffer,
    mime: 'image/jpeg',
    bytes: buffer.byteLength,
    width: outMeta.width ?? 0,
    height: outMeta.height ?? 0,
  };
}
