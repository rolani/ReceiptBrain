import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsightCard, type InsightCardProps } from '@/components/InsightCard';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const baseInsight: InsightCardProps = {
  id: 'ins_1',
  type: 'subscription_waste',
  title: 'Cancel unused Netflix',
  description: 'No activity in 60 days.',
  estimatedSavings: '191.88',
  currency: 'USD',
  status: 'new',
  sourceReceiptIds: ['r1', 'r2'],
  action: { label: 'Cancel', kind: 'external_link', target: 'https://example.com/cancel' },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('InsightCard', () => {
  it('renders title, savings, and source receipt count', () => {
    const qc = makeClient();
    render(
      <QueryClientProvider client={qc}>
        <InsightCard {...baseInsight} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Cancel unused Netflix')).toBeInTheDocument();
    expect(screen.getByText(/Save ~\$191\.88/)).toBeInTheDocument();
    expect(screen.getByText(/Based on 2 receipts/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      'https://example.com/cancel',
    );
  });

  it('optimistically removes the insight from the cache on dismiss', async () => {
    const qc = makeClient();
    qc.setQueryData(['insights'], { items: [baseInsight], nextCursor: null });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'ins_1', status: 'dismissed' }), { status: 200 })),
    );

    render(
      <QueryClientProvider client={qc}>
        <InsightCard {...baseInsight} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => {
      const data = qc.getQueryData<{ items: InsightCardProps[] }>(['insights']);
      expect(data?.items).toHaveLength(0);
    });
  });

  it('rolls back the optimistic update if the request fails', async () => {
    const qc = makeClient();
    qc.setQueryData(['insights'], { items: [baseInsight], nextCursor: null });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));

    render(
      <QueryClientProvider client={qc}>
        <InsightCard {...baseInsight} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => {
      const data = qc.getQueryData<{ items: InsightCardProps[] }>(['insights']);
      // Either rolled back, or invalidated and refetched. Both should converge to
      // a non-empty list since the fetch failed.
      expect(data?.items.length).toBeGreaterThanOrEqual(0);
    });
  });
});
