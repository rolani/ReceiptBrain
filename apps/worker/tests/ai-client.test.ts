import { describe, expect, it, vi } from 'vitest';
import { AiClient } from '../src/ai-client.js';

describe('AiClient', () => {
  it('sends X-Internal-Token on every request', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const c = new AiClient({
      baseUrl: 'http://ai',
      token: 'secret',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await c.recommend({ summary: {} });
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[1].headers).toMatchObject({ 'X-Internal-Token': 'secret' });
  });

  it('throws when AI service returns non-2xx', async () => {
    const fetchMock = vi.fn(async () => new Response('boom', { status: 502 }));
    const c = new AiClient({
      baseUrl: 'http://ai',
      token: 't',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await expect(c.extract(Buffer.from('hi'))).rejects.toThrow(/AI .* 502/);
  });

  it('base64-encodes images for /extract', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    const c = new AiClient({
      baseUrl: 'http://ai',
      token: 't',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await c.extract(Buffer.from([1, 2, 3, 4]));
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(call[1].body as string);
    expect(body.image_b64).toBe(Buffer.from([1, 2, 3, 4]).toString('base64'));
  });
});
