import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const records = JSON.parse(fs.readFileSync(process.env.IDEA_TEST_RECORDS || 'artifacts/account-test-records.json'));
const base = process.env.IDEA_TEST_BASE || 'http://127.0.0.1:5178';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  let sessionRequests = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/accounts.php?action=session', async route => {
    sessionRequests++;
    if (sessionRequests === 1) await gate;
    await route.continue();
  });
  await page.goto(base + '/login', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address', { exact: true }).fill(records.buyerEmail);
  await page.getByLabel('Password', { exact: true }).fill(records.password);
  await expect.poll(() => sessionRequests).toBe(1);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Please wait…', exact: true })).toBeDisabled();
  // The sign-in must wait for the existing bootstrap instead of opening another session.
  await page.waitForTimeout(250);
  expect(sessionRequests).toBe(1);
  release();
  await expect(page).toHaveURL(base + '/account', { timeout: 30000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('main')).toContainText('My Account');
  console.log('PASS: sign-in during delayed session bootstrap sends one session request; authentication survives a full page reload.');
} finally { await browser.close(); }
