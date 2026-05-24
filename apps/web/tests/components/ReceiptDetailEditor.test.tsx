import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReceiptDetailEditor } from '@/components/ReceiptDetailEditor';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

function renderEditor(overrides: Partial<React.ComponentProps<typeof ReceiptDetailEditor>['receipt']> = {}) {
  const receipt = {
    id: 'r1',
    status: 'needs_review',
    merchant: 'Costco',
    rawMerchant: 'COSTCO',
    total: '43.97',
    currency: 'USD',
    purchasedAt: null,
    fieldConfidence: { merchant: 0.9, total: 0.85, purchasedAt: 0.5 },
    items: [],
    ...overrides,
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReceiptDetailEditor receipt={receipt} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  refresh.mockReset();
});

describe('ReceiptDetailEditor', () => {
  it('shows review reasons for needs_review receipts', () => {
    renderEditor();
    expect(screen.getByText(/needs review/i)).toBeInTheDocument();
    expect(screen.getByText(/purchase date is missing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark as reviewed/i })).toBeInTheDocument();
  });

  it('renders a purchase date field', () => {
    renderEditor({ purchasedAt: '2026-05-22T15:00:00.000Z' });
    expect(screen.getByLabelText(/purchase date/i)).toBeInTheDocument();
  });

  it('marks as reviewed via PATCH with status extracted', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'r1', status: 'extracted' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    renderEditor();
    fireEvent.change(screen.getByLabelText(/purchase date/i), {
      target: { value: '2026-05-22T10:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: /mark as reviewed/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/receipts/r1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"status":"extracted"'),
        }),
      );
    });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('shows re-extract only for failed receipts', () => {
    renderEditor({ status: 'failed' });
    expect(screen.getByRole('button', { name: /re-extract/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark as reviewed/i })).not.toBeInTheDocument();
  });
});
