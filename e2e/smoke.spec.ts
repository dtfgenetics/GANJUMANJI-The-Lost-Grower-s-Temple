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
  await expect(page.locator('#tools')).toHaveText('0');
  await expect(page.locator('#regions')).toHaveText('0 / 3');
  await expect(page.locator('#checkpoints')).toHaveText('0 / 2');
  await expect(page.locator('#turns')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();

  const journal = page.locator('#guidePanel');
  const journalButton = page.getByRole('button', { name: 'Journal', exact: true });
  await expect(journal).toHaveAttribute('aria-hidden', 'true');
  await journalButton.click();
  await expect(journal).toHaveAttribute('aria-hidden', 'false');
  await expect(journalButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#pressureHint')).toContainText('surge every 9 moves');
  await expect(page.getByText(/expedition kits automatically neutralize/i)).toBeVisible();
  await expect(page.locator('[data-region-step="root_halls"]')).toHaveAttribute('data-state', 'current');
  await expect(page.getByRole('button', { name: 'Close journal', exact: true }).first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(journal).toHaveAttribute('aria-hidden', 'true');
  await expect(journalButton).toBeFocused();

  const audio = page.locator('#audioButton');
  await audio.click();
  await expect(audio).toHaveText('Sound Off');
  await page.reload();
  await expect(page.locator('#audioButton')).toHaveText('Sound Off');

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#turns')).toHaveText('1');
  await expect(page.locator('#saveStatus')).toHaveText('Checkpoint saved');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#turns')).toHaveText('2');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#turns')).toHaveText('2');
  await expect(page.locator('#message')).toHaveText('Saved expedition restored.');

  await page.screenshot({ path: testInfo.outputPath('ganjumanji-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#saveStatus')).toHaveText('Expedition saved');
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await expect(page.locator('#turns')).toHaveText('0');
  await expect(page.locator('#tools')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('loss result can restore the last automatic checkpoint', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chrome', 'Checkpoint-loss sequence only needs the desktop project.');
  await page.goto('/games/ganjumanji/');

  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight']) {
    await page.keyboard.press(key);
  }
  await expect(page.locator('#turns')).toHaveText('9');
  await expect(page.locator('#health')).toHaveText('1 / 3');

  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft']) {
    await page.keyboard.press(key);
  }

  await expect(page.locator('#resultModal')).toBeVisible();
  await expect(page.locator('#resultTitle')).toHaveText('The Temple Claimed This Run');
  await expect(page.getByRole('button', { name: 'Continue from Checkpoint', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue from Checkpoint', exact: true }).click();
  await expect(page.locator('#resultModal')).toBeHidden();
  await expect(page.locator('#turns')).toHaveText('17');
  await expect(page.locator('#health')).toHaveText('1 / 3');
  await expect(page.locator('#saveStatus')).toHaveText('Save restored');
});

test('touch movement and journal stay usable on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Touch control check only needs the mobile project.');
  await page.goto('/games/ganjumanji/');
  await expect(page.locator('#regionName')).toHaveText('The Root Halls');
  await expect(page.locator('#tools')).toHaveText('0');
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.locator('#guidePanel')).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: 'Close journal', exact: true }).first().click();
  await expect(page.locator('#guidePanel')).toHaveAttribute('aria-hidden', 'true');
  await page.getByRole('button', { name: 'Move right', exact: true }).click();
  await expect(page.locator('#turns')).toHaveText('1');
  await expect(page.locator('#saveStatus')).toHaveText('Checkpoint saved');
  await page.screenshot({ path: testInfo.outputPath('ganjumanji-mobile.png'), fullPage: true });
});
