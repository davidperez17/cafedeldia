import { expect, test } from '@playwright/test';

test('first load of / stays under 300 KB excluding lazy images', async ({ page }) => {
  let bytes = 0;
  page.on('response', async (res) => {
    if (res.request().resourceType() === 'image') return;
    const body = await res.body().catch(() => Buffer.alloc(0));
    bytes += body.length;
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(bytes).toBeLessThan(300 * 1024);
});
