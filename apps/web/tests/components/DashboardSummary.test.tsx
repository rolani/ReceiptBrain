import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSummary } from '@/components/DashboardSummary';

describe('DashboardSummary', () => {
  it('renders the four KPI labels and values', () => {
    render(
      <DashboardSummary
        totalSpend="1234.56"
        subscriptionCount={3}
        potentialSavings="42.00"
        receiptsCount={7}
      />,
    );
    expect(screen.getByText('Total spend (30d)')).toBeInTheDocument();
    expect(screen.getByText('$1234.56')).toBeInTheDocument();
    expect(screen.getByText('Active subscriptions')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Potential savings')).toBeInTheDocument();
    expect(screen.getByText('$42.00')).toBeInTheDocument();
    expect(screen.getByText('Receipts captured')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders a delta indicator when spendDeltaPct is provided', () => {
    render(
      <DashboardSummary
        totalSpend="100.00"
        subscriptionCount={0}
        potentialSavings="0.00"
        spendDeltaPct={-15.5}
      />,
    );
    expect(screen.getByText(/16%|15%/)).toBeInTheDocument();
  });
});
