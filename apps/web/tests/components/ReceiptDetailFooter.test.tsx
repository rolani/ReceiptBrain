import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReceiptDetailFooter } from '@/components/ReceiptDetailFooter';

describe('ReceiptDetailFooter', () => {
  it('links back to the receipts list', () => {
    render(<ReceiptDetailFooter />);

    const link = screen.getByRole('link', { name: /back to receipts/i });
    expect(link).toHaveAttribute('href', '/receipts');
  });
});
