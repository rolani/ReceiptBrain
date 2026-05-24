import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from '../src/app/page.js';

describe('HomePage (marketing)', () => {
  it('renders a brand-named heading and primary CTA', () => {
    render(<HomePage />);
    expect(screen.getAllByText(/ReceiptBrain/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1 }).textContent ?? '').toMatch(
      /every receipt tracked/i,
    );
  });

  it('highlights receipts and subscriptions', () => {
    render(<HomePage />);
    expect(screen.getByText(/recent receipts/i)).toBeInTheDocument();
    expect(screen.getByText(/active subscriptions/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /receipts are the source of truth/i }),
    ).toBeInTheDocument();
  });

  it('shows "Start free" CTAs pointing at sign-in', () => {
    render(<HomePage />);
    const ctas = screen.getAllByRole('link', { name: /start free/i });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute('href', '/sign-in');
    }
  });

  it('shows features and FAQ section headings', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: /receipts are the source of truth/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quick answers/i })).toBeInTheDocument();
  });
});
