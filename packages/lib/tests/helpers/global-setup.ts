import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://receiptbrain:receiptbrain@localhost:5432/receiptbrain_test?schema=public';

export default async function setup(): Promise<void> {
  try {
    execSync(
      'pnpm exec prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss',
      {
        cwd: PACKAGE_ROOT,
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    process.env.RECEIPTBRAIN_TEST_DB_READY = '1';
  } catch (err) {
    process.env.RECEIPTBRAIN_TEST_DB_READY = '0';
    console.warn(
      `[lib tests] Postgres unreachable at ${TEST_DATABASE_URL} — integration tests will be skipped.\n` +
        (err instanceof Error ? err.message : String(err)),
    );
  }
}
