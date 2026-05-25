import { describe, expect, it } from 'vitest';
import { describeUploadFormats } from '@/lib/settings-data';

describe('describeUploadFormats', () => {
  it('lists common receipt file types', () => {
    const text = describeUploadFormats();
    expect(text).toContain('JPEG');
    expect(text).toContain('PDF');
    expect(text).toContain('HEIC');
  });
});
