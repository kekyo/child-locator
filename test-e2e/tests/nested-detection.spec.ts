import { test, expect } from '@playwright/test'

const DETECTED_TEXT_LOCATOR = '[data-testid="detected-item"]'
const SCROLL_CONTAINER_SELECTOR = '[data-testid="grid-container"]'

async function moveMouseAndWait(
  page: import('@playwright/test').Page,
  x: number,
  y: number
) {
  await page.mouse.move(x, y)
  await page.waitForTimeout(350)
}

test.describe('Child Locator - Nested Element Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:59517/')
    const elementScrollButton = page.getByRole('button', { name: 'Element scroll' })
    await elementScrollButton.waitFor({ timeout: 10000 })
    if (!(await elementScrollButton.isDisabled())) {
      await elementScrollButton.click()
    }
    await page.waitForSelector('[data-testid^="Item-"]', { timeout: 10000 })
    await page.waitForSelector(DETECTED_TEXT_LOCATOR, { timeout: 10000 })
    await page.waitForTimeout(500)
  })

  test('detects a trackable element nested within non-trackable wrappers', async ({ page }) => {
    const scrollContainer = page.locator(SCROLL_CONTAINER_SELECTOR).first()
    await scrollContainer.evaluate((element) => {
      element.scrollTop = 1300
    })

    const nestedItem = page.locator('[data-testid="Nested-Item-1"]')
    await nestedItem.scrollIntoViewIfNeeded()

    const nestedBox = await nestedItem.boundingBox()
    if (!nestedBox) {
      throw new Error('Nested item bounding box not found')
    }

    await moveMouseAndWait(
      page,
      nestedBox.x + nestedBox.width / 2,
      nestedBox.y + nestedBox.height / 2
    )

    let detectedText =
      (await page.locator(DETECTED_TEXT_LOCATOR).textContent()) ?? ''
    expect(detectedText).toContain('Nested-Item-1')

    const edgeOffsets = [
      { name: 'top edge', x: nestedBox.x + nestedBox.width / 2, y: nestedBox.y + 6 },
      { name: 'right edge', x: nestedBox.x + nestedBox.width - 6, y: nestedBox.y + nestedBox.height / 2 },
      { name: 'bottom edge', x: nestedBox.x + nestedBox.width / 2, y: nestedBox.y + nestedBox.height - 6 },
      { name: 'left edge', x: nestedBox.x + 6, y: nestedBox.y + nestedBox.height / 2 },
    ]

    for (const edge of edgeOffsets) {
      await moveMouseAndWait(page, edge.x, edge.y)
      detectedText =
        (await page.locator(DETECTED_TEXT_LOCATOR).textContent()) ?? ''
      expect(detectedText).toContain('Nested-Item-1')
    }

    const wrapperPaddingArea = page.locator('[data-testid="nested-wrapper-inner"]')
    const wrapperBox = await wrapperPaddingArea.boundingBox()
    if (!wrapperBox) {
      throw new Error('Nested wrapper bounding box not found')
    }

    await moveMouseAndWait(page, wrapperBox.x + 4, wrapperBox.y + 4)
    detectedText =
      (await page.locator(DETECTED_TEXT_LOCATOR).textContent()) ?? ''
    expect(detectedText).not.toContain('Nested-Item-1')
    expect(detectedText).toMatch(/None|Unknown Element/)
  })
})
