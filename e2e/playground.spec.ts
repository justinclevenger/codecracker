import { test, expect } from '@playwright/test'

test.describe('Playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('textarea')
  })

  // Helper to get mode tab buttons (which contain descriptive text)
  function modeTab(page: any, mode: 'crack' | 'detect' | 'decrypt' | 'encrypt') {
    return page.locator(`button:has(span.font-semibold:text-is("${mode}"))`)
  }

  // Helper to get the action button in the action bar (last button with exact text)
  function actionButton(page: any) {
    return page.locator('.border-t button').first()
  }

  test('renders the homepage with all key elements', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('codecracker')
    await expect(page.getByPlaceholder('paste ciphertext here...')).toBeVisible()
    await expect(modeTab(page, 'crack')).toBeVisible()
    await expect(modeTab(page, 'detect')).toBeVisible()
    await expect(modeTab(page, 'decrypt')).toBeVisible()
  })

  test('example buttons populate the textarea', async ({ page }) => {
    const textarea = page.getByPlaceholder('paste ciphertext here...')
    await expect(textarea).toHaveValue('')

    await page.getByRole('button', { name: 'ROT13' }).click()
    await expect(textarea).toHaveValue('Uryyb Jbeyq')

    await page.getByRole('button', { name: 'Base64' }).click()
    await expect(textarea).toHaveValue('SGVsbG8gV29ybGQ=')
  })

  test('crack mode: cracks ROT13 ciphertext', async ({ page }) => {
    await page.getByRole('button', { name: 'ROT13' }).click()
    await actionButton(page).click()

    // Wait for results - use first() since multiple results may decode to "Hello World"
    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })
    // Check the cipher type badge appears in a result card
    await expect(page.locator('.result-card').filter({ hasText: 'rot13' }).first()).toBeVisible()
  })

  test('crack mode: cracks Base64 ciphertext', async ({ page }) => {
    await page.getByRole('button', { name: 'Base64' }).click()
    await actionButton(page).click()

    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.result-card').filter({ hasText: 'base64' }).first()).toBeVisible()
  })

  test('crack mode: cracks Caesar ciphertext', async ({ page }) => {
    await page.getByRole('button', { name: 'Caesar' }).click()
    await actionButton(page).click()

    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })
  })

  test('crack mode: cracks Hex ciphertext', async ({ page }) => {
    await page.getByRole('button', { name: 'Hex' }).click()
    await actionButton(page).click()

    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.result-card').filter({ hasText: 'hex' }).first()).toBeVisible()
  })

  test('detect mode: identifies cipher type', async ({ page }) => {
    await modeTab(page, 'detect').click()

    const textarea = page.getByPlaceholder('paste ciphertext here...')
    await textarea.fill('SGVsbG8gV29ybGQ=')

    await actionButton(page).click()

    // Should show "detected" header
    await expect(page.locator('h2', { hasText: 'detected' })).toBeVisible({ timeout: 10000 })
    // base64 should be among detected types (in a result card, not the example button)
    await expect(page.locator('.result-card').filter({ hasText: 'base64' }).first()).toBeVisible()
  })

  test('decrypt mode: decrypts with known cipher type', async ({ page }) => {
    await modeTab(page, 'decrypt').click()

    await page.locator('select').selectOption('caesar')

    const textarea = page.getByPlaceholder('paste ciphertext here...')
    await textarea.fill('Khoor Zruog')

    await actionButton(page).click()

    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows warning for short input', async ({ page }) => {
    const textarea = page.getByPlaceholder('paste ciphertext here...')
    await textarea.fill('Hi')

    await actionButton(page).click()

    await expect(page.getByText(/short input/i)).toBeVisible({ timeout: 10000 })
  })

  test('crack button is disabled when textarea is empty', async ({ page }) => {
    await expect(actionButton(page)).toBeDisabled()

    await page.getByPlaceholder('paste ciphertext here...').fill('test')
    await expect(actionButton(page)).toBeEnabled()
  })

  test('Cmd/Ctrl+Enter submits the form', async ({ page }) => {
    await page.getByPlaceholder('paste ciphertext here...').fill('Uryyb Jbeyq')
    await page.getByPlaceholder('paste ciphertext here...').press('Meta+Enter')

    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })
  })

  test('show/hide details toggle works', async ({ page }) => {
    await page.getByRole('button', { name: 'ROT13' }).click()
    await actionButton(page).click()

    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })

    const showDetails = page.getByText(/show details/i).first()
    await showDetails.click()

    await expect(page.getByText('qualityScore')).toBeVisible()

    await page.getByText(/hide details/i).first().click()
    await expect(page.getByText('qualityScore')).not.toBeVisible()
  })

  test('mode tabs switch correctly', async ({ page }) => {
    // Start in crack mode - no select visible
    await expect(page.locator('select')).not.toBeVisible()

    // Switch to decrypt mode - select should appear
    await modeTab(page, 'decrypt').click()
    await expect(page.locator('select')).toBeVisible()

    // Switch to detect mode - select should disappear
    await modeTab(page, 'detect').click()
    await expect(page.locator('select')).not.toBeVisible()

    // Switch back to crack mode
    await modeTab(page, 'crack').click()
    await expect(page.locator('select')).not.toBeVisible()
  })

  test('encrypt mode: encrypts plaintext with selected cipher', async ({ page }) => {
    await modeTab(page, 'encrypt').click()

    // Cipher selector should be visible in encrypt mode
    await expect(page.locator('select')).toBeVisible()

    await page.locator('select').selectOption('caesar')

    const textarea = page.getByPlaceholder('enter plaintext here...')
    await textarea.fill('Hello World')

    await actionButton(page).click()

    // Should show "encrypted" header and the ciphertext
    await expect(page.locator('h2', { hasText: 'encrypted' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Khoor Zruog')).toBeVisible()
    // Cipher type badge
    await expect(page.locator('.result-card').filter({ hasText: 'caesar' }).first()).toBeVisible()
  })

  test('encrypt mode: encrypts with Base64', async ({ page }) => {
    await modeTab(page, 'encrypt').click()
    await page.locator('select').selectOption('base64')

    const textarea = page.getByPlaceholder('enter plaintext here...')
    await textarea.fill('Hello World')

    await actionButton(page).click()

    await expect(page.getByText('SGVsbG8gV29ybGQ=')).toBeVisible({ timeout: 10000 })
  })

  test('max results input limits output', async ({ page }) => {
    const maxInput = page.locator('input[type="number"]')
    await maxInput.fill('2')

    await page.getByRole('button', { name: 'ROT13' }).click()
    await actionButton(page).click()

    await expect(page.getByText('Hello World').first()).toBeVisible({ timeout: 10000 })

    // Count result cards
    const resultCards = page.locator('.result-card')
    await expect(resultCards).toHaveCount(2, { timeout: 5000 })
  })
})
