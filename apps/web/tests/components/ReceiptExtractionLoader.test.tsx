import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ReceiptExtractionLoader } from '@/components/ReceiptExtractionLoader';

describe('ReceiptExtractionLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an accessible busy status with progress indicator', () => {
    render(<ReceiptExtractionLoader />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/reading your receipt/i)).toBeInTheDocument();
    expect(
      screen.getByText(/this page will update automatically when ready/i),
    ).toBeInTheDocument();
  });

  it('cycles through extraction step labels', () => {
    render(<ReceiptExtractionLoader />);

    expect(screen.getByText(/reading your receipt/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByText(/finding merchant/i)).toBeInTheDocument();
  });
});
