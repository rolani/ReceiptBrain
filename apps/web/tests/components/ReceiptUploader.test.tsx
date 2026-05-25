import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReceiptUploader } from '@/components/ReceiptUploader';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

function renderUploader() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReceiptUploader />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  push.mockReset();
});

describe('ReceiptUploader', () => {
  it('navigates to receipt detail after a successful upload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ receiptId: 'rcp_abc', deduped: false }),
          { status: 202 },
        ),
      ),
    );

    renderUploader();
    const file = new File(['jpeg-bytes'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/receipts/rcp_abc'),
    );
  });

  it('navigates to existing receipt when upload is deduped', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ receiptId: 'rcp_existing', deduped: true }),
          { status: 200 },
        ),
      ),
    );

    renderUploader();
    const file = new File(['same-image'], 'dup.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/receipts/rcp_existing'),
    );
  });
});
