import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReceiptCard } from '@/components/ReceiptCard';

describe('ReceiptCard', () => {
  it('renders merchant, total, and status chip', () => {
    render(
      <ReceiptCard
        id="r1"
        merchant="Starbucks"
        total="6.25"
        currency="USD"
        purchasedAt={new Date('2026-05-01').toISOString()}
        status="extracted"
      />,
    );
    expect(screen.getByText('Starbucks')).toBeInTheDocument();
    expect(screen.getByText(/\$6\.25/)).toBeInTheDocument();
    expect(screen.getByText(/extracted/i)).toBeInTheDocument();
  });

  it('falls back when merchant is missing', () => {
    render(
      <ReceiptCard
        id="r1"
        merchant={null}
        total={null}
        currency={null}
        purchasedAt={null}
        status="uploaded"
      />,
    );
    expect(screen.getByText(/Unknown merchant/)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('uses an "uploaded" chip when not yet processed', () => {
    render(
      <ReceiptCard
        id="r1"
        merchant="X"
        total="1.00"
        currency="USD"
        purchasedAt={null}
        status="uploaded"
      />,
    );
    expect(screen.getByText(/uploaded/i)).toBeInTheDocument();
  });
});
