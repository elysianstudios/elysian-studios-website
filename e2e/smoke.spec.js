import { test, expect } from '@playwright/test'

// All paths are relative to baseURL (…/elysian-studios-website/).

test('home loads and renders posts from Firestore', async ({ page }) => {
  await page.goto('./')
  // Posts come from the live database — wait for chronicle links to appear.
  await expect(page.locator('a[href*="/read/"]').first()).toBeVisible({ timeout: 20000 })
  await expect(page.locator('h1').first()).toBeVisible()
})

test('archive lists chronicles and search works', async ({ page }) => {
  await page.goto('./archive')
  await expect(page.locator('a[href*="/read/"]').first()).toBeVisible({ timeout: 20000 })
  await page.getByPlaceholder(/search/i).fill('gandhi')
  await expect(page.locator('body')).toContainText(/chronicle/i)
})

test('a chronicle opens in the reader', async ({ page }) => {
  await page.goto('./archive')
  const first = page.locator('a[href*="/read/"]').first()
  await expect(first).toBeVisible({ timeout: 20000 })
  const href = await first.getAttribute('href')
  await page.goto('.' + href.replace(/^.*\/elysian-studios-website/, ''))
  await expect(page.locator('article, h1').first()).toBeVisible({ timeout: 20000 })
})

test('static pages render', async ({ page }) => {
  for (const path of ['./about', './team', './contact']) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  }
})

test('Google Analytics is wired', async ({ page }) => {
  await page.goto('./')
  const hasGtag = await page.evaluate(() => typeof window.gtag === 'function')
  expect(hasGtag).toBe(true)
})
