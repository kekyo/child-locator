import { test, expect } from '@playwright/test'

test('Center button isolated test', async ({ page }) => {
  await page.goto('http://localhost:59517/test-page.html')
  await page.waitForTimeout(1000)
  
  console.log('=== Center Button Isolated Test ===')
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const detected = document.querySelector('#detected')?.textContent || 'Not found'
    const offset = document.querySelector('#current-offset')?.textContent || 'Not found'
    return {
      offset: offset,
      detected: detected
    }
  })
  
  console.log(`Initial state: ${initialState.offset} - ${initialState.detected}`)
  
  // Verify Item 5 is detected in initial state
  expect(initialState.detected).toContain('Item 5')
  expect(initialState.offset).toContain('(212px, 175px)')
  
  // Change to top left coordinates (75px, 63px) - should detect Item 1
  console.log('\nSetting top left coordinates (75px, 63px)...')
  await page.locator('#x-input').fill('75px')
  await page.locator('#y-input').fill('63px')
  await page.waitForTimeout(500)
  
  const afterTopLeft = await page.evaluate(() => {
    const detected = document.querySelector('#detected')?.textContent || 'Not found'
    const offset = document.querySelector('#current-offset')?.textContent || 'Not found'
    return {
      offset: offset,
      detected: detected
    }
  })
  
  console.log(`After top left: ${afterTopLeft.offset} - ${afterTopLeft.detected}`)
  expect(afterTopLeft.detected).toContain('Item 1')
  expect(afterTopLeft.offset).toContain('(75px, 63px)')
  
  // Change back to center coordinates (212px, 175px) - should detect Item 5
  console.log('\nSetting center coordinates (212px, 175px)...')
  await page.locator('#x-input').fill('212px')
  await page.locator('#y-input').fill('175px')
  await page.waitForTimeout(500)
  
  const afterCenter = await page.evaluate(() => {
    const detected = document.querySelector('#detected')?.textContent || 'Not found'
    const offset = document.querySelector('#current-offset')?.textContent || 'Not found'
    return {
      offset: offset,
      detected: detected
    }
  })
  
  console.log(`After center: ${afterCenter.offset} - ${afterCenter.detected}`)
  
  // Expect Item 5 to be detected
  expect(afterCenter.detected).toContain('Item 5')
  expect(afterCenter.offset).toContain('(212px, 175px)')
  
  console.log('\n✅ Center button isolated test completed successfully')
}) 