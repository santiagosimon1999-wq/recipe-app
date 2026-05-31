import { expect, test, type Page } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''
const E2E_SECOND_EMAIL = process.env.E2E_TEST_SECOND_EMAIL ?? ''
const E2E_SECOND_PASSWORD = process.env.E2E_TEST_SECOND_PASSWORD ?? ''
const E2E_TARGET_USERNAME = process.env.E2E_TEST_TARGET_USERNAME ?? ''
const E2E_COMMENT_RECIPE_ID = process.env.E2E_TEST_COMMENT_RECIPE_ID ?? ''

const HAS_PRIMARY_AUTH = Boolean(E2E_EMAIL && E2E_PASSWORD)
const HAS_SECOND_AUTH = Boolean(E2E_SECOND_EMAIL && E2E_SECOND_PASSWORD)

function uniqueLabel(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function expectAuthScreen(page: Page) {
  await expect(page.getByRole('heading', { name: /^Savora$/i }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^Log in$/i })).toBeVisible()
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^Log in$/i }).click()
  await expect(page.getByRole('button', { name: /\+ Create Recipe/i })).toBeVisible({
    timeout: 20_000,
  })
}

async function logout(page: Page) {
  await page.getByRole('button', { name: /^Log out$/i }).click()
  await expectAuthScreen(page)
}

async function logoutIfPossible(page: Page) {
  const logoutButton = page.getByRole('button', { name: /^Log out$/i })
  if ((await logoutButton.count()) === 0) return

  await logoutButton.first().click()
  await expect(page.getByRole('button', { name: /^Log in$/i })).toBeVisible()
}

async function createRecipe(page: Page, options?: { isPublic?: boolean }) {
  const isPublic = options?.isPublic ?? true
  const title = uniqueLabel(isPublic ? 'E2E-Public' : 'E2E-Private')
  const description = `Description for ${title}`

  await page.getByRole('button', { name: /\+ Create Recipe/i }).click()
  await expect(page.getByRole('heading', { name: /Create Recipe/i })).toBeVisible()

  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Description').fill(description)
  await page.getByLabel('Ingredients — one per line').fill('1 cup rice\n1 tsp salt')
  await page.getByLabel('Instructions').fill('Cook rice. Season and serve.')

  const publicCheckbox = page.getByLabel('Share this recipe publicly')
  if (isPublic) {
    await publicCheckbox.check()
  } else {
    await publicCheckbox.uncheck()
  }

  await page.getByRole('button', { name: /Save Recipe/i }).click()

  const cardButton = page
    .getByRole('button', { name: new RegExp(`Open ${escapeRegex(title)}`) })
    .first()
  await expect(cardButton).toBeVisible({ timeout: 20_000 })

  return { title, description }
}

function getRecipeCardButton(page: Page, title: string) {
  return page
    .getByRole('button', { name: new RegExp(`Open ${escapeRegex(title)}`) })
    .first()
}

async function confirmDeleteRecipe(page: Page) {
  await page.getByRole('button', { name: /^Delete$/i }).first().click()
  const confirmDialog = page.getByRole('dialog')
  await expect(confirmDialog).toBeVisible()
  await confirmDialog.getByRole('button', { name: /^Delete$/i }).click()
}

async function deleteRecipeByTitleIfPresent(page: Page, title: string) {
  await page.goto('/community')

  const cardButton = getRecipeCardButton(page, title)
  if ((await cardButton.count()) === 0) return

  await cardButton.click()
  await confirmDeleteRecipe(page)
  await expect(cardButton).toHaveCount(0, { timeout: 20_000 })
}

test.describe('release gate — signed out smoke', () => {
  test('auth smoke: app loads and login/sign-up UI is reachable', async ({ page }) => {
    await page.goto('/')
    await expectAuthScreen(page)
    await page.getByRole('tab', { name: /^Sign Up$/i }).click()
    await expect(page.getByRole('button', { name: /^Create account$/i })).toBeVisible()
  })

  test('search route smoke while signed out', async ({ page }) => {
    await page.goto('/search')
    await expectAuthScreen(page)
  })

  test('activity feed route smoke while signed out', async ({ page }) => {
    await page.goto('/following')
    await expectAuthScreen(page)
  })

  test('creator dashboard route smoke while signed out', async ({ page }) => {
    await page.goto('/creator')
    await expectAuthScreen(page)
  })
})

test.describe('release gate — authenticated core flows', () => {
  test.skip(!HAS_PRIMARY_AUTH, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD')

  test('recipe create/edit/delete happy path', async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)

    const { title } = await createRecipe(page, { isPublic: true })
    const cardButton = getRecipeCardButton(page, title)
    await cardButton.click()

    await expect(page.getByRole('button', { name: /^Edit$/i })).toBeVisible()
    await page.getByRole('button', { name: /^Edit$/i }).click()
    await expect(page.getByRole('heading', { name: /Edit Recipe/i })).toBeVisible()

    const updatedDescription = `Updated ${uniqueLabel('description')}`
    await page.getByLabel('Description').fill(updatedDescription)
    await page.getByRole('button', { name: /Update Recipe/i }).click()

    await expect(cardButton).toBeVisible({ timeout: 20_000 })
    await cardButton.click()
    await expect(page.getByText(updatedDescription)).toBeVisible()

    await confirmDeleteRecipe(page)
    await expect(cardButton).toHaveCount(0, { timeout: 20_000 })
  })

  test('search page smoke while signed in', async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
    await page.goto('/search')
    await expect(
      page.getByRole('heading', { name: /Find recipes across the community/i })
    ).toBeVisible()
    await expect(page.getByLabel('Search recipes')).toBeVisible()
  })

  test('activity feed page smoke while signed in', async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
    await page.goto('/following')
    await expect(
      page.getByRole('heading', { name: /Latest social activity from chefs you follow/i })
    ).toBeVisible()
  })

  test('creator dashboard page smoke while signed in', async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
    await page.goto('/creator')
    await expect(page.getByRole('heading', { name: /Creator Dashboard/i })).toBeVisible()
  })
})

test.describe('release gate — optional seeded-data checks', () => {
  test.skip(!HAS_PRIMARY_AUTH, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD')

  test('follow/unfollow flow (optional seeded username)', async ({ page }) => {
    test.skip(!E2E_TARGET_USERNAME, 'Set E2E_TEST_TARGET_USERNAME')

    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
    await page.goto(`/users/${encodeURIComponent(E2E_TARGET_USERNAME)}`)

    const followButton = page
      .getByRole('button', { name: /^(Follow|Following)$/i })
      .first()
    await expect(followButton).toBeVisible()

    const wasFollowing = (await followButton.innerText()).toLowerCase().includes('following')
    await followButton.click()

    if (wasFollowing) {
      await expect(followButton).toContainText(/Follow/i, { timeout: 10_000 })
      await followButton.click()
      await expect(followButton).toContainText(/Following/i, { timeout: 10_000 })
    } else {
      await expect(followButton).toContainText(/Following/i, { timeout: 10_000 })
      await followButton.click()
      await expect(followButton).toContainText(/Follow/i, { timeout: 10_000 })
    }
  })

  test('comment flow (optional seeded recipe id)', async ({ page }) => {
    test.skip(!E2E_COMMENT_RECIPE_ID, 'Set E2E_TEST_COMMENT_RECIPE_ID')

    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
    await page.goto(`/recipes/${encodeURIComponent(E2E_COMMENT_RECIPE_ID)}`)
    await expect(page.getByRole('heading', { name: /^Comments$/i })).toBeVisible({
      timeout: 15_000,
    })

    const commentBody = uniqueLabel('e2e-comment')
    await page.getByLabel('Write a comment…').fill(commentBody)
    await page.getByRole('button', { name: /^Submit$/i }).click()
    await expect(page.getByText(commentBody)).toBeVisible({ timeout: 15_000 })
  })

  test('public/private visibility guard between two users (optional)', async ({
    page,
  }) => {
    test.skip(!HAS_SECOND_AUTH, 'Set E2E_TEST_SECOND_EMAIL and E2E_TEST_SECOND_PASSWORD')

    const createdTitles: string[] = []

    try {
      await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
      const privateRecipe = await createRecipe(page, { isPublic: false })
      const publicRecipe = await createRecipe(page, { isPublic: true })
      createdTitles.push(privateRecipe.title, publicRecipe.title)
      await logout(page)

      await loginAs(page, E2E_SECOND_EMAIL, E2E_SECOND_PASSWORD)
      await page.goto('/search')
      const searchInput = page.getByLabel('Search recipes')

      await searchInput.fill(privateRecipe.title)
      await expect(
        page.getByRole('heading', { name: /No recipes matched/i })
      ).toBeVisible({
        timeout: 15_000,
      })

      await searchInput.fill(publicRecipe.title)
      await expect(
        page.getByRole('button', {
          name: new RegExp(`Open ${escapeRegex(publicRecipe.title)}`),
        })
      ).toBeVisible({ timeout: 15_000 })
    } finally {
      if (createdTitles.length > 0) {
        await logoutIfPossible(page)
        await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
        for (const title of createdTitles) {
          await deleteRecipeByTitleIfPresent(page, title)
        }
      }
    }
  })
})
