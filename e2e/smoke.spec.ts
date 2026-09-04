import { expect, test } from '@playwright/test';

test('renders low-chrome campaign HUD, journal drawer, saves, and restart flow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto('/games/ganjumanji/');
  await expect(page.getByRole('heading', { name: 'Ganjumanji' })).toBeVisible();
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#regionName')).toHaveText('The Root Halls');
  await expect(page.locator('#health')).toHaveText('3 / 3');
  await expect(page.locator('#relics')).toHaveText('0 / 6');
  await expect(page.locator('#regionRelics')).toHaveText('0 / 3');
  await expect(page.locator('#wards')).toHaveText('0');
  await expect(page.locator('#regions')).toHaveText('0 / 3');
  await expect(page.locator('#checkpoints')).toHaveText('0 / 2');
  await expect(page.locator('#turns')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

  const journal = page.locator('#guidePanel');
  const journalButton = page.getByRole('button', { name: 'Journal' });
  await expect(journal).toHaveAttribute('aria-hidden', 'true');
  await expect(journalButton).toHaveAttribute('aria-expanded', 'false');
  await journalButton.click();
  await expect(journal).toHaveAttribute('aria-hidden', 'false');
  await expect(journalButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('heading', { name: 'The Root Halls' })).toBeVisible();
  await expect(page.locator('[data-region-step="root_halls"]')).toHaveAttribute('data-state', 'current');
  await expect(page.getByRole('button', { name: 'Close journal' }).first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(journal).toHaveAttribute('aria-hidden', 'true');
  await expect(journalButton).toBeFocused();

  const audio = page.locator('#audioButton');
  await expect(audio).toHaveText('Sound On');
  await audio.click();
  await expect(audio).toHaveText('Sound Off');
  await expect(audio).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.locator('#audioButton')).toHaveText('Sound Off');

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#turns')).toHaveText('1');
  await expect(page.locator('#saveStatus')).toHaveText('Checkpoint saved');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#turns')).toHaveText('2');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#turns')).toHaveText('2');
  await expect(page.locator('#message')).toHaveText('Saved expedition restored.');

  await page.screenshot({ path: testInfo.outputPath('ganjumanji-desktop.png'), fullPage: true });

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#saveStatus')).toHaveText('Expedition saved');

  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.locator('#turns')).toHaveText('0');
  await expect(page.locator('#health')).toHaveText('3 / 3');
  await expect(page.locator('#relics')).toHaveText('0 / 6');
  await expect(page.locator('#regionRelics')).toHaveText('0 / 3');
  await expect(page.locator('#wards')).toHaveText('0');
  await expect(page.locator('#checkpoints')).toHaveText('0 / 2');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('touch movement and journal stay usable on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Touch control check only needs the mobile project.');
  await page.goto('/games/ganjumanji/');
  await expect(page.locator('#regionName')).toHaveText('The Root Halls');
  await page.getByRole('button', { name: 'Journal' }).click();
  await expect(page.locator('#guidePanel')).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: 'Close journal' }).first().click();
  await expect(page.locator('#guidePanel')).toHaveAttribute('aria-hidden', 'true');
  await page.getByRole('button', { name: 'Move right' }).click();
  await expect(page.locator('#turns')).toHaveText('1');
  await expect(page.locator('#saveStatus')).toHaveText('Checkpoint saved');
  await page.screenshot({ path: testInfo.outputPath('ganjumanji-mobile.png'), fullPage: true });
});
