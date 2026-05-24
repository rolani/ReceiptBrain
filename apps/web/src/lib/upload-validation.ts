import { env } from '@/env';

export const ALLOWED_UPLOAD_MIMES = [
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
export type AllowedUploadMime = (typeof ALLOWED_UPLOAD_MIMES)[number];

// Extensions accepted in case the browser leaves `file.type` empty for HEIC
// (Safari) or AVIF on older Chromiums. Mapped to canonical MIME below.
const EXTENSION_TO_MIME: Record<string, AllowedUploadMime> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  gif: 'image/gif',
  pdf: 'application/pdf',
};

function mimeForFile(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return (ext && EXTENSION_TO_MIME[ext]) || '';
}

export interface UploadValidation {
  ok: true;
  mime: AllowedUploadMime;
  bytes: number;
}

export interface UploadValidationError {
  ok: false;
  reason: 'too_large' | 'unsupported_mime' | 'empty';
  message: string;
}

export function validateUpload(file: File): UploadValidation | UploadValidationError {
  if (!file || file.size === 0) {
    return { ok: false, reason: 'empty', message: 'empty file' };
  }
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      reason: 'too_large',
      message: `file ${file.size} bytes exceeds ${env.MAX_UPLOAD_MB}MB cap`,
    };
  }
  const mime = mimeForFile(file);
  if (!(ALLOWED_UPLOAD_MIMES as readonly string[]).includes(mime)) {
    return {
      ok: false,
      reason: 'unsupported_mime',
      message: `mime "${mime || 'unknown'}" not in allowlist`,
    };
  }
  return { ok: true, mime: mime as AllowedUploadMime, bytes: file.size };
}
