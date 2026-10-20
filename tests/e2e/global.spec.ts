import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/p/caramel-latte', '/metodos', '/metodos/v60', '/visitanos'];

for (const route of ROUTES) {
  test(`${route} has no purchase wording and no horizontal scroll`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/agregar|pedir|pagar|carrito|pedido/i);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
}
