import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '../src/EmptyState.js';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No receipts yet" description="Upload your first one." />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No receipts yet')).toBeInTheDocument();
    expect(screen.getByText(/upload your first one/i)).toBeInTheDocument();
  });

  it('renders an optional action', () => {
    render(<EmptyState title="x" action={<button>Upload</button>} />);
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
  });
});
