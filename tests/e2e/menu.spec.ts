import { expect, test } from '@playwright/test';

test.describe('menu home', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('shows the hero and three house specials', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu café, del día');
    const specials = page.locator('[data-section="destacados"] a');
    await expect(specials).toHaveCount(3);
    await expect(page.locator('[data-open-status]')).not.toBeEmpty();
  });

  test('search ignores accents and filters the full catalog', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Buscar en el menú' }).fill('frio');
    const visible = page.locator('[data-section="catalogo"] a[data-slug]:visible');
    await expect(visible.first()).toBeVisible();
    await expect(page.locator('[data-section="catalogo"] a[data-slug="cold-brew"]')).toBeVisible();
    await expect(page.locator('[data-section="catalogo"] a[data-slug="croissant"]')).toBeHidden();
    await expect(page.locator('[data-section="destacados"]')).toBeHidden();
  });

  test('search with no results shows an empty message', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Buscar en el menú' }).fill('zzz');
    await expect(page.getByText('No encontramos «zzz»')).toBeVisible();
  });

  test('a category chip keeps only its products and hides featured sections', async ({ page }) => {
    await page.getByRole('button', { name: 'Repostería' }).click();
    const visible = page.locator('[data-section="catalogo"] a[data-slug]:visible');
    await expect(visible).toHaveCount(2);
    await expect(page.locator('[data-section="catalogo"] a[data-slug="croissant"]')).toBeVisible();
    await expect(page.locator('[data-section="catalogo"] a[data-slug="pan-banano"]')).toBeVisible();
    await expect(page.locator('[data-section="destacados"]')).toBeHidden();
    await expect(page.locator('[data-section="recomendados"]')).toBeHidden();
    await page.getByRole('button', { name: 'Todos' }).click();
    await expect(page.locator('[data-section="destacados"]')).toBeVisible();
  });

  test('search and chip combine with AND', async ({ page }) => {
    await page.getByRole('button', { name: 'Repostería' }).click();
    await page.getByRole('searchbox', { name: 'Buscar en el menú' }).fill('banano');
    await expect(page.locator('[data-section="catalogo"] a[data-slug]:visible')).toHaveCount(1);
  });

  test('a card opens the product detail', async ({ page }) => {
    await page.locator('[data-section="destacados"] a[href="/p/caramel-latte"]').click();
    await expect(page).toHaveURL(/\/p\/caramel-latte$/);
  });
});
