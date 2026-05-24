import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ExtractionStatus,
  InsightStatus,
  InsightType,
  ItemCategory,
  ReceiptStatus,
  SubscriptionInterval,
  SubscriptionStatus,
} from '@receiptbrain/contracts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

async function parseEnums(): Promise<Record<string, string[]>> {
  const src = await readFile(schemaPath, 'utf8');
  const result: Record<string, string[]> = {};
  const re = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const name = m[1]!;
    const body = m[2]!;
    const values = body
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .filter((line) => line.length > 0);
    result[name] = values;
  }
  return result;
}

describe('Prisma enum values match @receiptbrain/contracts', () => {
  const cases: Array<[string, readonly string[]]> = [
    ['ReceiptStatus', ReceiptStatus.options],
    ['ItemCategory', ItemCategory.options],
    ['SubscriptionInterval', SubscriptionInterval.options],
    ['SubscriptionStatus', SubscriptionStatus.options],
    ['InsightType', InsightType.options],
    ['InsightStatus', InsightStatus.options],
    ['ExtractionStatus', ExtractionStatus.options],
  ];

  it.each(cases)('%s', async (name, expected) => {
    const enums = await parseEnums();
    expect(enums[name]).toEqual([...expected]);
  });
});
