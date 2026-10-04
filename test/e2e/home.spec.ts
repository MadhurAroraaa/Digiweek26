import { expect, test } from '@playwright/test';

test('homepage loads without console errors and initializes the hero canvas', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /DIGIWEEK '26/i })).toBeVisible();
  await expect(page.locator('.webgl-canvas canvas')).toHaveCount(1);
  await page.mouse.move(300, 300);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
  await expect(page.locator('#events')).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('menu navigation and Coming Soon public states work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open menu/i }).click();
  await expect(page.getByRole('dialog', { name: /site navigation/i })).toBeVisible();
  await page.getByRole('button', { name: /events/i }).click();

  await expect(page.getByText('EVENTS COMING SOON')).toBeVisible();
  await page.getByRole('button', { name: /open menu/i }).click();
  await page.getByRole('button', { name: /sponsors/i }).click();
  await expect(page.getByText('SOON.')).toBeVisible();
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('reduced motion loads without hiding public content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByText('SCROLL TO ENTER')).toBeVisible();
  await page.evaluate(() => document.getElementById('sponsors')?.scrollIntoView());
  await expect(page.getByText('SPONSORS')).toBeVisible();
});

test('hero communicates UCC & DA and J.C. Bose University institutional hierarchy with minimal header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-org-name')).toHaveText('UCC & DA');
  await expect(page.getByText('A FLAGSHIP INITIATIVE · PRESENTED BY')).toBeVisible();
  await expect(page.getByText('J.C. BOSE UNIVERSITY OF SCIENCE & TECHNOLOGY', { exact: true })).toBeVisible();
  await expect(page.locator('.hero-brand-logos img')).toHaveCount(2);
  await expect(page.locator('.header-brand-logos img')).toHaveCount(0);
});
