import { expect, test } from '@playwright/test';

test('renders the temple, checkpoints movement, restores save, and restarts cleanly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto('/games/ganjumanji/');
  await expect(page.getByRole('heading', { name: 'Ganjumanji' })).toBeVisible();
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#relics')).toHaveText('0 / 3');
  await expect(page.locator('#turns')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#turns')).toHaveText('1');
  await expect(page.locator('#saveStatus')).toHaveText('Checkpoint saved');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#turns')).toHaveText('2');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#turns')).toHaveText('2');
  await expect(page.locator('#message')).toHaveText('Saved expedition restored.');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#saveStatus')).toHaveText('Expedition saved');

  await page.getByRole('button', { name: 'Restart Expedition' }).click();
  await expect(page.locator('#turns')).toHaveText('0');
  await expect(page.locator('#health')).toHaveText('3');
  await expect(page.locator('#relics')).toHaveText('0 / 3');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('touch movement control advances and checkpoints the expedition on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Touch control check only needs the mobile project.');
  await page.goto('/games/ganjumanji/');
  await page.getByRole('button', { name: 'Move right' }).click();
  await expect(page.locator('#turns')).toHaveText('1');
  await expect(page.locator('#saveStatus')).toHaveText('Checkpoint saved');
});
