import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignInPage from '@/app/(auth)/sign-in/page';
import { isGoogleAuthEnabled } from '@/lib/google-auth';

vi.mock('@/lib/google-auth', () => ({
  isGoogleAuthEnabled: vi.fn(() => false),
}));

async function renderPage(params: { state?: string; error?: string } = {}): Promise<void> {
  const jsx = await SignInPage({ searchParams: Promise.resolve(params) });
  render(jsx);
}

describe('Sign-in page', () => {
  it('renders an email input and submit button', async () => {
    await renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send.*link|sign in/i })).toBeInTheDocument();
  });

  it('mentions the magic-link flow', async () => {
    await renderPage();
    expect(screen.getAllByText(/magic link/i).length).toBeGreaterThan(0);
  });

  it('shows a confirmation message when redirected from check-email state', async () => {
    await renderPage({ state: 'sent' });
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });

  it('does not show Google sign-in when OAuth is not configured', async () => {
    vi.mocked(isGoogleAuthEnabled).mockReturnValue(false);
    await renderPage();
    expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument();
  });

  it('shows Google sign-in when OAuth is configured', async () => {
    vi.mocked(isGoogleAuthEnabled).mockReturnValue(true);
    await renderPage();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });
});
