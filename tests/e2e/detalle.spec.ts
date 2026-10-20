import { expect, test } from '@playwright/test';

test.describe('product detail', () => {
  test('price updates with size and milk, informative only', async ({ page }) => {
    await page.goto('/p/caramel-latte');
    const headerPrice = page.locator('header [data-price]');
    await expect(headerPrice).toHaveText('Q34');
    await page.getByRole('radio', { name: /^L/ }).check({ force: true });
    await expect(headerPrice).toHaveText('Q40');
    await page.getByRole('radio', { name: /Avena/ }).check({ force: true });
    await expect(headerPrice).toHaveText('Q44');
    await expect(page.locator('[data-summary]')).toHaveText('L · Avena');
    await expect(page.locator('.bar [data-price]')).toHaveText('Q44');
    const hero = page.locator('[data-hero]');
    await expect.poll(async () => (await hero.boundingBox())?.width).toBe(280);
  });

  test('a product without sizes or milk shows neither selector', async ({ page }) => {
    await page.goto('/p/capuchino');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Capuchino');
    await expect(page.getByRole('radiogroup', { name: 'Tamaño' })).toHaveCount(0);
    await expect(page.getByRole('radiogroup', { name: 'Leche' })).toHaveCount(0);
  });

  test('a sold-out product says it is not available today', async ({ page }) => {
    await page.goto('/p/chemex-del-dia');
    await expect(page.getByText('Hoy no disponible')).toBeVisible();
  });

  test('pairings link to their own detail', async ({ page }) => {
    await page.goto('/p/caramel-latte');
    await expect(page.getByRole('heading', { name: 'Acompáñalo con' })).toBeVisible();
    await page.locator('a[href="/p/croissant"]').first().click();
    await expect(page).toHaveURL(/\/p\/croissant$/);
  });

  test('shows the coffee sheet only with present fields and a directions button', async ({ page }) => {
    await page.goto('/p/caramel-latte');
    await expect(page.getByText('Huehuetenango')).toBeVisible();
    await expect(page.getByRole('link', { name: /Cómo llegar/ })).toHaveAttribute('target', '_blank');
    await page.goto('/p/croissant');
    await expect(page.getByText('Origen')).toHaveCount(0);
  });
});
