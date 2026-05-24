import { NextResponse } from 'next/server';
import { prisma } from '@receiptbrain/lib/prisma';
import { pingRedis } from '@receiptbrain/lib/queue';
import { env } from '@/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CheckResult {
  ok: boolean;
  durationMs?: number;
  error?: string;
}

async function checkDb(): Promise<CheckResult> {
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, durationMs: Date.now() - t };
  } catch (e) {
    return { ok: false, error: String((e as Error).message).slice(0, 200) };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const t = Date.now();
  try {
    const ok = await pingRedis(env.REDIS_URL);
    return ok
      ? { ok, durationMs: Date.now() - t }
      : { ok: false, error: 'ping failed' };
  } catch (e) {
    return { ok: false, error: String((e as Error).message).slice(0, 200) };
  }
}

async function checkAi(): Promise<CheckResult> {
  const t = Date.now();
  try {
    const ctl = AbortSignal.timeout(1500);
    const res = await fetch(`${env.AI_SERVICE_URL}/health`, { signal: ctl });
    return { ok: res.ok, durationMs: Date.now() - t };
  } catch (e) {
    return { ok: false, error: String((e as Error).message).slice(0, 200) };
  }
}

export async function GET() {
  const [db, redis, ai] = await Promise.all([checkDb(), checkRedis(), checkAi()]);
  const ok = db.ok && redis.ok && ai.ok;
  return NextResponse.json(
    {
      ok,
      service: 'web',
      version: process.env.npm_package_version ?? '0.0.0',
      checks: { db, redis, ai },
    },
    { status: ok ? 200 : 503 },
  );
}
