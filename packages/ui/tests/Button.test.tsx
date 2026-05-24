import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../src/Button.js';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('shows loading copy and is disabled while loading', () => {
    render(<Button loading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent(/loading/i);
  });

  it('invokes onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
