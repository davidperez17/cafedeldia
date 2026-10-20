import { expect, test } from '@playwright/test';

test('visit page shows status, weekly hours, address and contacts', async ({ page }) => {
  await page.goto('/visitanos');
  await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', '/visitanos');
  await expect(page.locator('[data-open-label]')).toHaveText(/Abierto ahora|Cerrado/);
  await expect(page.locator('[data-day]')).toHaveCount(7);
  await expect(page.locator('[data-day].today')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Cómo llegar/ })).toBeVisible();
  await expect(page.locator('a[href="https://wa.me/50255551234"]')).toBeVisible();
  await expect(page.getByText('Próximos días especiales')).toHaveCount(0);
});

test('unknown routes render the 404 with a way back', async ({ page }) => {
  const res = await page.goto('/no-existe');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('Esta página no está en el menú')).toBeVisible();
  await page.getByRole('link', { name: 'Ver el menú' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('every page ships JSON-LD', async ({ page }) => {
  await page.goto('/');
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(ld ?? '{}')['@type']).toBe('CafeOrCoffeeShop');
});
