import { expect, test, type Page } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''
const E2E_SECOND_EMAIL = process.env.E2E_TEST_SECOND_EMAIL ?? ''
const E2E_SECOND_PASSWORD = process.env.E2E_TEST_SECOND_PASSWORD ?? ''
const E2E_TARGET_USERNAME = process.env.E2E_TEST_TARGET_USERNAME ?? ''
const E2E_COMMENT_RECIPE_ID = process.env.E2E_TEST_COMMENT_RECIPE_ID ?? ''

const HAS_PRIMARY_AUTH = Boolean(E2E_EMAIL && E2E_PASSWORD)
const HAS_SECOND_AUTH = Boolean(E2E_SECOND_EMAIL && E2E_SECOND_PASSWORD)
const CREATE_RECIPE_BUTTON = /Create a new recipe/i
const LOGIN_SUBMIT_BUTTON = /log in/i
const AUTH_PROTECTED_ROUTE = '/profile'

function uniqueLabel(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Protected routes trigger AuthGate → AuthPage for signed-out users. */
async function gotoAuthScreen(page: Page) {
  await page.goto(AUTH_PROTECTED_ROUTE)
}

async function expectAuthScreen(page: Page) {
  await expect(page.getByRole('heading', { name: /^Savora$/i }).first()).toBeVisible()
  await expect(page.getByRole('tab', { name: /^Login$/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /^Sign Up$/i })).toBeVisible()

  const loginTabSelected =
    (await page.getByRole('tab', { name: /^Login$/i }).getAttribute('aria-selected')) ===
    'true'

  if (loginTabSelected) {
    await expect(page.locator('#login-email')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()
    await expect(page.getByRole('button', { name: LOGIN_SUBMIT_BUTTON })).toBeVisible()
  } else {
    await expect(page.getByRole('button', { name: /^Create account$/i })).toBeVisible()
  }
}

async function expectSignedOut(page: Page) {
  await expect(page.getByRole('button', { name: /^Log out$/i })).toHaveCount(0)
}

async function loginAs(page: Page, email: string, password: string) {
  await gotoAuthScreen(page)
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.getByRole('button', { name: LOGIN_SUBMIT_BUTTON }).click()
  await expect(page.getByRole('button', { name: CREATE_RECIPE_BUTTON })).toBeVisible({
    timeout: 20_000,
  })
}

async function logout(page: Page) {
  await page.getByRole('button', { name: /^Log out$/i }).click()
  await expectSignedOut(page)
}

async function logoutIfPossible(page: Page) {
  const logoutButton = page.getByRole('button', { name: /^Log out$/i })
  if ((await logoutButton.count()) === 0) return

  await logoutButton.first().click()
  await expectSignedOut(page)
}

async function createRecipe(page: Page, options?: { isPublic?: boolean }) {
  const isPublic = options?.isPublic ?? true
  const title = uniqueLabel(isPublic ? 'E2E-Public' : 'E2E-Private')
  const description = `Description for ${title}`

  await page.getByRole('button', { name: CREATE_RECIPE_BUTTON }).click()
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
    await gotoAuthScreen(page)
    await expectAuthScreen(page)
    await page.getByRole('tab', { name: /^Sign Up$/i }).click()
    await expect(page.getByRole('button', { name: /^Create account$/i })).toBeVisible()
  })

  test('search route smoke while signed out', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByTestId('app-compact-header')).toBeVisible()
    await expect(page.getByTestId('app-full-header')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: /Find recipes across the community/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Find your next meal/i })
    ).toHaveCount(0)
    await expect(page.getByTestId('discover-filters-toggle')).toBeVisible()
  })

  test('home route uses full hero header', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('app-full-header')).toBeVisible()
    await expect(page.getByTestId('app-compact-header')).toHaveCount(0)
    await expect(page.getByText(/Social recipe sharing/i)).toBeVisible()
  })

  test('community route uses compact header', async ({ page }) => {
    await page.goto('/community')
    await expect(page.getByTestId('app-compact-header')).toBeVisible()
    await expect(page.getByTestId('app-full-header')).toHaveCount(0)
    await expect(page.getByText(/Social recipe sharing/i)).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: /See what the Savora community is cooking/i })
    ).toBeVisible()
    await expect(page.getByTestId('community-feed-intro')).toBeVisible()
  })

  test('home signed-out shows dashboard welcome copy', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-dashboard-welcome')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Welcome to your kitchen/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /See what the Savora community is cooking/i })
    ).toHaveCount(0)
  })

  test('home and community filters stay independent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByTestId('discover-filters-toggle').click()
    await page.getByRole('button', { name: /^Breakfast$/i }).click()
    await expect(page.getByTestId('discover-filters-toggle-label')).toHaveText('1 filter')

    await page.goto('/community')
    await expect(page.getByTestId('discover-filters-toggle-label')).toHaveText('Filters')
    await expect(page.getByTestId('discover-filter-chips')).toHaveCount(0)
  })

  test('discover filters are collapsed by default on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(page.getByTestId('discover-filters-panel')).toBeHidden()
    await expect(page.getByRole('button', { name: /^Breakfast$/i })).toHaveCount(0)
  })

  test('desktop filters toggle opens category groups', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByTestId('discover-filters-toggle').click()
    await expect(page.getByTestId('discover-filters-panel')).toBeVisible()
    await expect(page.getByText(/^Meal Type$/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Breakfast$/i })).toBeVisible()
  })

  test('selecting a filter shows chip and clear all', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByTestId('discover-filters-toggle').click()
    await page.getByRole('button', { name: /^Breakfast$/i }).click()
    await expect(page.getByTestId('discover-filter-chips')).toBeVisible()
    await expect(page.getByRole('button', { name: /Remove Breakfast filter/i })).toBeVisible()
    await expect(page.getByTestId('discover-filters-toggle-label')).toHaveText('1 filter')
    await page.getByRole('button', { name: /^Clear all$/i }).click()
    await expect(page.getByTestId('discover-filter-chips')).toHaveCount(0)
    await expect(page.getByTestId('discover-filters-toggle-label')).toHaveText('Filters')
  })

  test('cuisine filter group is collapsed until expanded', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByTestId('discover-filters-toggle').click()
    await expect(page.getByRole('button', { name: /^Italian$/i })).toHaveCount(0)
    await page.getByTestId('category-filter-group-toggle-cuisine').click()
    await expect(page.getByRole('button', { name: /^Italian$/i })).toBeVisible()
  })

  test('active cuisine filter keeps group expanded', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByTestId('discover-filters-toggle').click()
    await page.getByTestId('category-filter-group-toggle-cuisine').click()
    await page.getByRole('button', { name: /^Mexican$/i }).click()
    await expect(page.getByTestId('discover-filter-chips')).toBeVisible()
    await page.getByTestId('discover-filters-toggle').click()
    await page.getByTestId('discover-filters-toggle').click()
    await expect(page.getByRole('button', { name: /^Mexican$/i })).toBeVisible()
  })

  test('multiple filters can be selected across groups', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByTestId('discover-filters-toggle').click()
    await page.getByRole('button', { name: /^Breakfast$/i }).click()
    await page.getByTestId('category-filter-group-toggle-cuisine').click()
    await page.getByRole('button', { name: /^Italian$/i }).click()
    await expect(page.getByTestId('discover-filters-toggle-label')).toHaveText('2 filters')
    await expect(
      page.getByRole('button', { name: /Remove Breakfast filter/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Remove Italian filter/i }),
    ).toBeVisible()
  })

  test('mobile filter sheet opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByTestId('discover-filters-toggle').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /^Filters$/i })).toBeVisible()
    await dialog.getByRole('button', { name: /^Close filters$/i }).click()
    await expect(dialog).toHaveCount(0)
  })

  test('activity feed route smoke while signed out', async ({ page }) => {
    await page.goto('/following')
    await expectAuthScreen(page)
  })

  test('creator dashboard route smoke while signed out', async ({ page }) => {
    await page.goto('/creator')
    await expectAuthScreen(page)
  })

  test('home route smoke while signed out', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /^Savora$/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Log out$/i })).toHaveCount(0)
    await expect(
      page.getByRole('navigation').getByRole('button', { name: /^Log in$/i })
    ).toBeVisible()
    await expect(
      page.getByRole('navigation').getByRole('button', { name: /^Sign up$/i })
    ).toBeVisible()
    await expect(
      page.getByText(/Discover, save, and share recipes with a food-loving community/i)
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Create your free account/i })
    ).toBeVisible()
  })

  test('signed-out header CTA reaches auth screen', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation')
      .getByRole('button', { name: /^Sign up$/i })
      .click()
    await expectAuthScreen(page)
    await expect(page.getByRole('tab', { name: /^Sign Up$/i })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  test('signed-out create action reaches auth screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('.bottom-nav').getByLabel(CREATE_RECIPE_BUTTON).click()
    await expectAuthScreen(page)
    await expect(
      page.getByText(/Create an account to publish your own recipes/i)
    ).toBeVisible()
  })

  test('signed-out user can access community page', async ({ page }) => {
    await page.goto('/community')
    await expect(page.getByTestId('app-compact-header')).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Go to Savora home/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Log out$/i })).toHaveCount(0)
  })

  test('desktop header shows primary nav and More dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const primaryNav = page.locator('.app-nav__routes')
    await expect(primaryNav.getByRole('link', { name: /^Discover$/i })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: /^Community$/i })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: /^Search$/i })).toBeVisible()
    await expect(
      primaryNav.getByRole('button', { name: /^Open more menu$/i })
    ).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: /^Creator$/i })).toHaveCount(0)
    await expect(primaryNav.getByRole('link', { name: /^Saved$/i })).toHaveCount(0)
    await expect(primaryNav.getByRole('link', { name: /^Profile$/i })).toHaveCount(0)
  })

  test('desktop More menu opens with account and app destinations', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const primaryNav = page.locator('.app-nav__routes')
    await primaryNav.getByRole('button', { name: /^Open more menu$/i }).click()

    const menu = page.getByRole('menu', { name: /^More menu$/i })
    await expect(menu).toBeVisible()

    for (const label of [
      'Log in',
      'Sign up',
      'Saved Recipes',
      'Notifications',
      'Profile',
      "What's New",
      'About Savora',
      'Privacy',
      'Terms',
      'Feedback',
    ]) {
      await expect(menu.getByRole('menuitem', { name: new RegExp(label, 'i') })).toBeVisible()
    }
  })

  test('desktop More menu About navigates while signed out', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const primaryNav = page.locator('.app-nav__routes')
    await primaryNav.getByRole('button', { name: /^Open more menu$/i }).click()
    await page
      .getByRole('menu', { name: /^More menu$/i })
      .getByRole('menuitem', { name: /About Savora/i })
      .click()

    await expect(page).toHaveURL(/\/about\/?$/)
    await expect(page.getByRole('menu', { name: /^More menu$/i })).toHaveCount(0)
  })

  test('desktop More menu protected item routes to auth while signed out', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const primaryNav = page.locator('.app-nav__routes')
    await primaryNav.getByRole('button', { name: /^Open more menu$/i }).click()
    await page
      .getByRole('menu', { name: /^More menu$/i })
      .getByRole('menuitem', { name: /Saved Recipes/i })
      .click()

    await expectAuthScreen(page)
    await expect(
      page.getByText(/save recipes and build your personal cookbook/i)
    ).toBeVisible()
  })

  test('mobile homepage limits repeated sign up buttons', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(
      page.getByRole('navigation').getByRole('button', { name: /^Sign up$/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Sign up$/i })).toHaveCount(1)
    await expect(
      page.getByRole('button', { name: /Create your free account/i })
    ).toBeVisible()
  })

  test('mobile bottom nav is visible and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const bottomNav = page.locator('.bottom-nav')
    await expect(bottomNav).toBeVisible()
    await expect(bottomNav.getByRole('link', { name: /^Search$/i })).toBeVisible()
    await expect(
      bottomNav.getByRole('button', { name: /^Open more menu$/i })
    ).toBeVisible()
    await bottomNav.getByRole('link', { name: /^Community$/i }).click()
    await expect(page).toHaveURL(/\/community\/?$/)
    await bottomNav.getByRole('link', { name: /^Home$/i }).click()
    await expect(page).toHaveURL(/\/\/?$/)
  })

  test('mobile More sheet opens with key destinations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page
      .locator('.bottom-nav')
      .getByRole('button', { name: /^Open more menu$/i })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /^More$/i })).toBeVisible()

    for (const label of [
      'Log in',
      'Sign up',
      'Saved Recipes',
      'Notifications',
      'Profile',
      "What's New",
      'About Savora',
      'Privacy',
      'Terms',
      'Feedback',
    ]) {
      await expect(dialog.getByRole('button', { name: label })).toBeVisible()
    }

    await expect(
      dialog.getByText(/Savora is currently in beta/i)
    ).toBeVisible()
  })

  test('mobile More sheet About link navigates while signed out', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page
      .locator('.bottom-nav')
      .getByRole('button', { name: /^Open more menu$/i })
      .click()

    await page.getByRole('dialog').getByRole('button', { name: /^About Savora$/i }).click()
    await expect(page).toHaveURL(/\/about\/?$/)
    await expect(page.getByRole('heading', { name: /^About Savora$/i })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('mobile More sheet protected item routes to auth while signed out', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page
      .locator('.bottom-nav')
      .getByRole('button', { name: /^Open more menu$/i })
      .click()

    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Saved Recipes/i })
      .click()

    await expectAuthScreen(page)
    await expect(
      page.getByText(/save recipes and build your personal cookbook/i)
    ).toBeVisible()
  })

  test('mobile header search link reaches search page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('.app-nav__mobile-search')).toBeVisible()
    await page.locator('.app-nav__mobile-search').click()
    await expect(page).toHaveURL(/\/search\/?$/)
    await expect(
      page.getByRole('heading', { name: /Find recipes across the community/i })
    ).toBeVisible()
  })

  test('mobile search page loads while signed out', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/search')
    await expect(page.getByRole('textbox', { name: 'Search recipes' })).toBeVisible()
    await expect(page.locator('.bottom-nav')).toBeVisible()
  })

  test('mobile recipe modal opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/community')
    const cardButton = page.getByRole('button', { name: /^Open /i }).first()
    test.skip((await cardButton.count()) === 0, 'No community recipes available')

    await cardButton.click()
    const recipeModal = page.locator('.recipe-modal')
    await expect(recipeModal).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('recipe-modal-sticky-actions')).toBeVisible()
    await recipeModal.getByRole('button', { name: /Close recipe/i }).click()
    await expect(recipeModal).toHaveCount(0)
  })

  test('desktop recipe modal does not show sticky action bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/community')
    const cardButton = page.getByRole('button', { name: /^Open /i }).first()
    test.skip((await cardButton.count()) === 0, 'No community recipes available')

    await cardButton.click()
    const recipeModal = page.locator('.recipe-modal')
    await expect(recipeModal).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('recipe-modal-sticky-actions')).toHaveCount(0)
    await expect(
      recipeModal.locator('.recipe-modal__engagement-actions--scroll')
    ).toBeVisible()
    await recipeModal.getByRole('button', { name: /Close recipe/i }).click()
  })

  test('signed-out save from mobile sticky bar opens Join Savora prompt', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/community')
    const cardButton = page.getByRole('button', { name: /^Open /i }).first()
    test.skip((await cardButton.count()) === 0, 'No community recipes available')

    await cardButton.click()
    const stickyBar = page.getByTestId('recipe-modal-sticky-actions')
    await expect(stickyBar).toBeVisible({ timeout: 10_000 })
    await stickyBar.getByRole('button', { name: /^Save recipe$/i }).click()
    await expect(page.getByRole('dialog').last()).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue to sign up/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue to login/i })).toBeVisible()
  })

  test('protected saved route shows guest teaser copy', async ({ page }) => {
    await page.goto('/saved')
    await expect(
      page.getByText(/save recipes and build your personal cookbook/i)
    ).toBeVisible()
  })

  test('footer trust links are visible on home', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('.app-footer')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer.getByRole('link', { name: /^About$/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /^Privacy$/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /^Terms$/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /^Feedback$/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /What'?s New/i })).toBeVisible()
    await expect(footer.getByText(/currently in beta/i)).toBeVisible()
  })

  test('auth screen shows minimal footer links', async ({ page }) => {
    await gotoAuthScreen(page)
    const footer = page.locator('.auth-trust-footer')
    await expect(footer.getByRole('link', { name: /^About$/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /^Privacy$/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /^Terms$/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /^Feedback$/i })).toBeVisible()
  })

  test('about page loads while signed out', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { name: /^About Savora$/i })).toBeVisible()
    await expect(page.getByText(/social recipe app/i)).toBeVisible()
  })

  test('privacy page loads while signed out', async ({ page }) => {
    await page.goto('/privacy')
    await expect(
      page.getByRole('heading', { name: /Privacy notice \(beta\)/i })
    ).toBeVisible()
    await expect(page.getByText(/may be updated before public launch/i)).toBeVisible()
  })

  test('terms page loads while signed out', async ({ page }) => {
    await page.goto('/terms')
    await expect(
      page.getByRole('heading', { name: /Terms of use \(beta\)/i })
    ).toBeVisible()
    await expect(page.getByText(/informational only/i)).toBeVisible()
  })

  test('feedback page loads while signed out', async ({ page }) => {
    await page.goto('/feedback')
    await expect(page.getByRole('heading', { name: /^Feedback$/i })).toBeVisible()

    const emailLink = page.getByRole('link', { name: /^Email feedback$/i })
    const unconfigured = page.getByText(/Feedback email is not configured yet/i)

    if ((await emailLink.count()) > 0) {
      await expect(emailLink).toBeVisible()
    } else {
      await expect(unconfigured).toBeVisible()
    }
  })

  test('whats-new page loads while signed out', async ({ page }) => {
    await page.goto('/whats-new')
    await expect(page.getByRole('heading', { name: /What'?s New/i })).toBeVisible()
    await expect(page.getByText(/Savora Beta/i)).toBeVisible()
    await expect(page.getByText(/public recipe browsing/i)).toBeVisible()
  })

  test('signed-out like opens Join Savora prompt', async ({ page }) => {
    await page.goto('/community')
    const likeButton = page.getByRole('button', { name: /^Like recipe$/i }).first()
    test.skip((await likeButton.count()) === 0, 'No community recipes available to like')

    await likeButton.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue to sign up/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Continue to login/i })).toBeVisible()
    await page.getByRole('button', { name: /Close Join Savora dialog/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
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

  test('mobile More sheet shows logged-in account destinations', async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page
      .locator('.bottom-nav')
      .getByRole('button', { name: /^Open more menu$/i })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    for (const label of [
      'Profile',
      'Saved Recipes',
      'Collections',
      'Following',
      'Notifications',
      'Creator Dashboard',
    ]) {
      await expect(dialog.getByRole('button', { name: label })).toBeVisible()
    }
  })

  test('desktop More menu shows logged-in account destinations', async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const primaryNav = page.locator('.app-nav__routes')
    await expect(
      primaryNav.getByRole('button', { name: /Create a new recipe/i })
    ).toBeVisible()
    await primaryNav.getByRole('button', { name: /^Open more menu$/i }).click()

    const menu = page.getByRole('menu', { name: /^More menu$/i })
    for (const label of [
      'Creator',
      'Following',
      'Saved',
      'Collections',
      'Notifications',
      'Profile',
    ]) {
      await expect(menu.getByRole('menuitem', { name: new RegExp(`^${label}$`, 'i') })).toBeVisible()
    }
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

  test('post-login redirect returns guest to previous page', async ({ page }) => {
    await page.goto('/community')
    const likeButton = page.getByRole('button', { name: /^Like recipe$/i }).first()
    test.skip((await likeButton.count()) === 0, 'No community recipes available to like')

    await likeButton.click()
    await page.getByRole('button', { name: /Continue to login/i }).click()
    await expectAuthScreen(page)

    await page.locator('#login-email').fill(E2E_EMAIL)
    await page.locator('#login-password').fill(E2E_PASSWORD)
    await page.getByRole('button', { name: LOGIN_SUBMIT_BUTTON }).click()

    await expect(page).toHaveURL(/\/community\/?$/, { timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Log out$/i })).toBeVisible()
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
