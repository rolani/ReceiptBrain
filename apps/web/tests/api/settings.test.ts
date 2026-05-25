import { describe, expect, it, beforeEach, vi } from 'vitest';
import { prismaMock, resetApiMocks, signedInAs, signedOut } from './_mocks';

vi.mock('@receiptbrain/lib', () => ({ prisma: prismaMock }));

import * as settings from '@/app/api/settings/route';

beforeEach(() => {
  resetApiMocks();
  prismaMock.user = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
});

describe('PATCH /api/settings', () => {
  it('401 when unauthed', async () => {
    await signedOut();
    const res = await settings.PATCH(
      new Request('http://localhost/api/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Alex' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('400 when body is empty', async () => {
    await signedInAs('u_1');
    const res = await settings.PATCH(
      new Request('http://localhost/api/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('400 when currency is invalid', async () => {
    await signedInAs('u_1');
    const res = await settings.PATCH(
      new Request('http://localhost/api/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ defaultCurrency: 'cad' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('updates the signed-in user preferences', async () => {
    await signedInAs('u_1');
    prismaMock.user.update.mockResolvedValue({
      name: 'Alex',
      defaultCurrency: 'CAD',
      defaultLocation: 'Toronto, ON',
      defaultLocationCountry: 'CA',
    });

    const res = await settings.PATCH(
      new Request('http://localhost/api/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Alex',
          defaultCurrency: 'CAD',
          defaultLocation: 'Toronto, ON',
          defaultLocationCountry: 'CA',
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      name: 'Alex',
      defaultCurrency: 'CAD',
      defaultLocation: 'Toronto, ON',
      defaultLocationCountry: 'CA',
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u_1' },
      data: {
        name: 'Alex',
        defaultCurrency: 'CAD',
        defaultLocation: 'Toronto, ON',
        defaultLocationCountry: 'CA',
      },
      select: {
        name: true,
        defaultCurrency: true,
        defaultLocation: true,
        defaultLocationCountry: true,
      },
    });
  });
});
