import { test, expect } from '@playwright/test'

test('admin requires login (no editing UI exposed when signed out)', async ({ page }) => {
  await page.goto('./admin')
  // Login screen should show; no list/new-post controls before auth.
  await expect(page.getByPlaceholder('Email', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByPlaceholder('Password', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /new post/i })).toHaveCount(0)
})

test('wrong credentials are rejected', async ({ page }) => {
  await page.goto('./admin')
  await page.getByPlaceholder('Email', { exact: true }).fill('attacker@example.com')
  await page.getByPlaceholder('Password', { exact: true }).fill('wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.locator('body')).toContainText(/incorrect|failed|invalid/i, { timeout: 15000 })
  // Still on the login screen — not authenticated.
  await expect(page.getByPlaceholder('Email', { exact: true })).toBeVisible()
})

// Note: Firestore write-permission enforcement is verified directly against the
// live rules in Node (scripts/checkRules.mjs / the rules audit), since the bare
// 'firebase/*' specifiers can't be re-imported inside page.evaluate.
