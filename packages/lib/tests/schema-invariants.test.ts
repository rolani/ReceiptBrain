import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

let schema = '';
beforeAll(async () => {
  schema = await readFile(schemaPath, 'utf8');
});

const MONEY_FIELDS = [
  'total',
  'subtotal',
  'tax',
  'tip',
  'unitPrice',
  'lineTotal',
  'amount',
  'estimatedSavings',
];

describe('schema invariants', () => {
  it.each(MONEY_FIELDS)('money field "%s" uses Decimal(12, 2) — never Float', (field) => {
    const declarationRe = new RegExp(`\\b${field}\\b\\s+Decimal[^\\n]*@db\\.Decimal\\(12,\\s*2\\)`);
    expect(schema).toMatch(declarationRe);
    expect(schema).not.toMatch(new RegExp(`\\b${field}\\b\\s+Float`));
  });

  it('ExtractionAttempt.costUsdEstimate uses Decimal(10, 4) for sub-cent precision', () => {
    expect(schema).toMatch(/costUsdEstimate\s+Decimal[^\n]*@db\.Decimal\(10,\s*4\)/);
  });

  it('Receipt has dedup unique key on (userId, imageHash)', () => {
    expect(schema).toContain('@@unique([userId, imageHash])');
  });

  it('Receipt has per-user query indexes', () => {
    expect(schema).toContain('@@index([userId, purchasedAt])');
    expect(schema).toContain('@@index([userId, status])');
  });

  it('Receipt is soft-deletable', () => {
    expect(schema).toMatch(/deletedAt\s+DateTime\?/);
  });

  it('Subscription has unique (userId, merchantId, interval)', () => {
    expect(schema).toContain('@@unique([userId, merchantId, interval])');
  });

  it('Insight has (userId, type, status) and (userId, status, createdAt) indexes', () => {
    expect(schema).toContain('@@index([userId, type, status])');
    expect(schema).toContain('@@index([userId, status, createdAt])');
  });

  it('every owned-data model carries createdAt and updatedAt', () => {
    for (const model of [
      'User',
      'Merchant',
      'Receipt',
      'Item',
      'Subscription',
      'Insight',
    ]) {
      const block = extractBlock(schema, `model ${model}`);
      expect(block, `${model} createdAt`).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
      expect(block, `${model} updatedAt`).toMatch(/updatedAt\s+DateTime\s+@updatedAt/);
    }
  });

  it('Receipt cascades on User delete to prevent orphan rows', () => {
    const block = extractBlock(schema, 'model Receipt');
    expect(block).toMatch(/user\s+User\s+@relation\([^)]*onDelete:\s*Cascade/);
  });
});

function extractBlock(src: string, header: string): string {
  const start = src.indexOf(header);
  if (start === -1) throw new Error(`block not found: ${header}`);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated block: ${header}`);
}
