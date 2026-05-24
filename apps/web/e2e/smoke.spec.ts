import { expect, test } from '@playwright/test';

// Lightweight smoke tests that don't depend on a seeded database or a real
// session — they verify the public-facing pages render. The fuller upload →
// extract → insight journey runs in CI with docker compose up first.

test('homepage renders the marketing CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ReceiptBrain/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /start free/i })).toBeVisible();
});

test('sign-in page shows the magic-link form', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /send.*link|sign in/i })).toBeVisible();
});

test('protected route redirects unauthenticated user to sign in', async ({ page }) => {
  const res = await page.goto('/dashboard');
  expect(res?.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/\/sign-in/);
});
