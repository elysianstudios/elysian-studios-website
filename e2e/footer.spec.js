import { test, expect } from '@playwright/test'

test('footer "Thinkers" scrolls to the thinkers section on home', async ({ page }) => {
  await page.goto('./about')                  // start on a different page
  const link = page.getByRole('contentinfo').getByRole('link', { name: 'Thinkers' })
  await expect(link).toBeVisible({ timeout: 15000 })
  await link.click()
  await expect(page).toHaveURL(/\/(elysian-studios-website\/)?$/)
  const thinkers = page.locator('#thinkers')
  await expect(thinkers).toBeVisible({ timeout: 20000 })
  // It should be scrolled near the top of the viewport, not left at page top.
  await page.waitForTimeout(1500)
  const top = await thinkers.evaluate(el => el.getBoundingClientRect().top)
  expect(top).toBeLessThan(600)
})

test('newsletter submit fires a request to the endpoint and confirms', async ({ page }) => {
  await page.goto('./')
  const emailInput = page.getByPlaceholder('Your email')
  await expect(emailInput).toBeAttached({ timeout: 15000 })
  await emailInput.scrollIntoViewIfNeeded()
  await emailInput.fill('e2e-subscriber@example.com')
  const [req] = await Promise.all([
    page.waitForRequest(r => r.url().includes('script.google.com') && r.method() === 'POST', { timeout: 10000 }),
    emailInput.press('Enter'),
  ])
  expect(req.postData()).toContain('e2e-subscriber@example.com')
  await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 })
})
