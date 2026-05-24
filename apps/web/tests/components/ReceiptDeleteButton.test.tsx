import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ReceiptDeleteButton } from '@/components/ReceiptDeleteButton';

function renderBtn(props: Partial<React.ComponentProps<typeof ReceiptDeleteButton>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReceiptDeleteButton receiptId="r1" label="Costco receipt" {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('confirm', vi.fn(() => true));
});

describe('ReceiptDeleteButton', () => {
  it('calls DELETE and redirects to /receipts by default', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as never);

    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /delete receipt/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/receipts/r1', { method: 'DELETE' }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/receipts'));
  });

  it('does not delete when confirmation is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /delete receipt/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an error when DELETE fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'nope' }), { status: 403 })),
    );
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as never);

    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /delete receipt/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/nope/i));
    expect(push).not.toHaveBeenCalled();
  });
});
