import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReceiptList } from '@/components/ReceiptList';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ReceiptList', () => {
  it('shows the empty state when there are no receipts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 })),
    );
    render(
      <QueryClientProvider client={makeClient()}>
        <ReceiptList />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText(/no receipts yet/i)).toBeInTheDocument());
  });

  it('renders one card per receipt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              items: [
                {
                  id: 'r1',
                  merchant: 'Starbucks',
                  total: '6.25',
                  currency: 'USD',
                  purchasedAt: new Date().toISOString(),
                  status: 'extracted',
                },
                {
                  id: 'r2',
                  merchant: 'Whole Foods',
                  total: '84.30',
                  currency: 'USD',
                  purchasedAt: new Date().toISOString(),
                  status: 'extracted',
                },
              ],
              nextCursor: null,
            }),
            { status: 200 },
          ),
      ),
    );
    render(
      <QueryClientProvider client={makeClient()}>
        <ReceiptList />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
      expect(screen.getByText('Whole Foods')).toBeInTheDocument();
    });
  });

  it('surfaces an error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    render(
      <QueryClientProvider client={makeClient()}>
        <ReceiptList />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText(/could not load receipts/i)).toBeInTheDocument());
  });
});
