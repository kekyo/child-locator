import { test, expect } from '@playwright/test'

test('Simple Center button test', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Simple Center Button Test ===')
  
  // Click Center button (using exact text match)
  await page.click('button:text-is("Center")')
  await page.waitForTimeout(500)
  
  // Check detection result
  const detectedText = await page.textContent('p:has-text("Detected:")')
  console.log(`Detection result: ${detectedText}`)
  
  // Expect Item 5 to be detected
  expect(detectedText).toContain('Item 5')
}) 