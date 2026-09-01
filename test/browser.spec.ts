import { expect, test } from '@playwright/test';

function numericAttribute(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Expected numeric attribute, received ${String(value)}`);
  return parsed;
}

test('Temple Atrium boots into a real playable 3D surface', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('./');
  await expect(page.locator('#game-canvas')).toBeVisible();
  await expect(page.locator('.webgl-fallback')).toHaveCount(0);
  await expect(page.locator('#objective')).toContainText('Recover');
  await expect(page.locator('#sigil-count')).toHaveText('0 / 3');
  await expect(page.locator('#resolve-count')).toHaveText('3');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'playing');

  const dimensions = await page.locator('#game-canvas').evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    return { width: canvas.width, height: canvas.height };
  });
  expect(dimensions.width).toBeGreaterThan(300);
  expect(dimensions.height).toBeGreaterThan(300);
  expect(errors).toEqual([]);
});

test('trusted keyboard movement and restart update deterministic state', async ({ page }) => {
  await page.goto('./');
  const root = page.locator('#app');
  const startZ = numericAttribute(await root.getAttribute('data-player-z'));

  await page.keyboard.down('w');
  await page.waitForTimeout(420);
  await page.keyboard.up('w');

  await expect.poll(async () => numericAttribute(await root.getAttribute('data-player-z'))).toBeLessThan(startZ - 0.7);

  await page.keyboard.press('r');
  await expect.poll(async () => numericAttribute(await root.getAttribute('data-player-z'))).toBeCloseTo(8, 1);
  await expect.poll(async () => numericAttribute(await root.getAttribute('data-player-x'))).toBeCloseTo(0, 1);
});

test('viewport stays contained and mobile controls can drive the player', async ({ page }, testInfo) => {
  await page.goto('./');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  if (testInfo.project.name !== 'mobile-chromium') return;

  const controls = page.locator('.touch-controls');
  await expect(controls).toBeVisible();
  const forward = page.locator('[data-action="forward"]');
  const box = await forward.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const root = page.locator('#app');
  const startZ = numericAttribute(await root.getAttribute('data-player-z'));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(420);
  await page.mouse.up();

  await expect.poll(async () => numericAttribute(await root.getAttribute('data-player-z'))).toBeLessThan(startZ - 0.6);
});
