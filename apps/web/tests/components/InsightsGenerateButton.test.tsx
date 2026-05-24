import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsightsGenerateButton } from '@/components/InsightsGenerateButton';

function renderBtn() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InsightsGenerateButton />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('InsightsGenerateButton', () => {
  it('POSTs /api/recommend on click and surfaces a queued confirmation', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ jobId: 'u_1', status: 'queued' }), { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/recommend', { method: 'POST' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/queued|generating|in progress/i),
    );
  });

  it('shows a friendly error when the API returns 429 rate-limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'Too many requests, retry later' }), {
            status: 429,
          }),
      ),
    );

    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/too many|rate/i),
    );
  });

  it('disables the button while the request is in-flight', async () => {
    let resolve!: (r: Response) => void;
    const pending = new Promise<Response>((r) => {
      resolve = r;
    });
    vi.stubGlobal('fetch', vi.fn(() => pending));

    renderBtn();
    const btn = screen.getByRole('button', { name: /generate insights/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    resolve(new Response(JSON.stringify({ jobId: 'u_1' }), { status: 202 }));
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
