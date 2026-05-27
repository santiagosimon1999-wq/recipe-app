import { test, expect } from '@playwright/test'

test('home shows Savora auth experience when logged out', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: /Savora/i }).first()
  ).toBeVisible()
  await expect(
    page.getByText(/Discover, create and share recipes/i)
  ).toBeVisible()
})

test('community route shows auth gate when logged out', async ({ page }) => {
  await page.goto('/community')

  await expect(
    page.getByRole('heading', { name: /Savora/i }).first()
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /Log in/i })).toBeVisible()
})

test('search route shows auth gate when logged out', async ({ page }) => {
  await page.goto('/search')

  await expect(
    page.getByRole('heading', { name: /Savora/i }).first()
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /Log in/i })).toBeVisible()
})
