import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionCard } from '@/components/SubscriptionCard';

describe('SubscriptionCard', () => {
  it('shows merchant, amount, status, confidence and source count', () => {
    render(
      <SubscriptionCard
        id="s1"
        merchant="Netflix"
        amount="15.99"
        currency="USD"
        interval="monthly"
        nextChargeEstimate={new Date('2026-06-15').toISOString()}
        confidence={0.92}
        status="active"
        sourceReceiptIds={['r1', 'r2', 'r3']}
      />,
    );
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText(/15\.99/)).toBeInTheDocument();
    expect(screen.getByText(/monthly/)).toBeInTheDocument();
    expect(screen.getByText(/active/)).toBeInTheDocument();
    expect(screen.getByText(/Confidence 92%/)).toBeInTheDocument();
    expect(screen.getByText(/Based on 3 receipts/)).toBeInTheDocument();
  });
});
