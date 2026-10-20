import { expect, test } from '@playwright/test';

test('methods grid lists all seven methods with the nav on Métodos', async ({ page }) => {
  await page.goto('/metodos');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Métodos de preparación');
  await expect(page.locator('a[href^="/metodos/"]')).toHaveCount(7);
  await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', '/metodos');
});

test('V60 detail shows ratio, temperature, six steps and total time', async ({ page }) => {
  await page.goto('/metodos/v60');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('V60');
  await expect(page.getByText('Método · Filtrado')).toBeVisible();
  await expect(page.getByText('1:15')).toBeVisible();
  await expect(page.getByText('92°C')).toBeVisible();
  await expect(page.locator('[data-step]')).toHaveCount(6);
  await expect(page.getByText('3:00 min')).toBeVisible();
  await expect(page.locator('a[href="/p/huehuetenango-lote-7"]')).toBeVisible();
});

test('a method without steps or bean hides those sections', async ({ page }) => {
  await page.goto('/metodos/chemex');
  await expect(page.getByText('Paso a paso')).toHaveCount(0);
  await expect(page.getByText('Granos recomendados')).toHaveCount(0);
});
