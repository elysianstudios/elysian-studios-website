import { test, expect } from '@playwright/test'

test('list text scales with the font control and matches paragraph size', async ({ page }) => {
  await page.goto('./read/elon-musk')
  const li = page.locator('article li').first()
  await expect(li).toBeVisible({ timeout: 20000 })

  const liBefore = await li.evaluate(el => parseFloat(getComputedStyle(el).fontSize))

  const inc = page.getByRole('button', { name: /increase text size/i })
  for (let i = 0; i < 3; i++) { await inc.click(); await page.waitForTimeout(100) }

  const liAfter = await li.evaluate(el => parseFloat(getComputedStyle(el).fontSize))
  expect(liAfter).toBeGreaterThan(liBefore) // list text responds to the + control

  const pAfter = await page.locator('article p').nth(1).evaluate(el => parseFloat(getComputedStyle(el).fontSize))
  expect(Math.abs(liAfter - pAfter)).toBeLessThan(1.5) // list text == prose size
})
