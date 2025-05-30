import { test, expect } from '@playwright/test'

test('Center button isolated test', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(2000) // Wait longer
  
  console.log('=== Center Button Isolated Test ===')
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found'
    }
  })
  
  console.log(`Initial state: ${initialState.offset} - ${initialState.detected}`)
  
  // Verify Item 5 is detected in initial state
  expect(initialState.detected).toContain('Item 5')
  expect(initialState.offset).toContain('(212px, 175px)')
  
  // Click another button first, then click Center button
  console.log('\nClicking Top Left button...')
  await page.click('button:has-text("Top Left")')
  await page.waitForTimeout(1000)
  
  const afterTopLeft = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found'
    }
  })
  
  console.log(`After Top Left: ${afterTopLeft.offset} - ${afterTopLeft.detected}`)
  expect(afterTopLeft.detected).toContain('Item 1')
  
  // Click Center button
  console.log('\nClicking Center button...')
  await page.click('button:text-is("Center")')
  await page.waitForTimeout(1000)
  
  const afterCenter = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found'
    }
  })
  
  console.log(`After Center: ${afterCenter.offset} - ${afterCenter.detected}`)
  
  // Expect Item 5 to be detected
  expect(afterCenter.detected).toContain('Item 5')
  expect(afterCenter.offset).toContain('(212px, 175px)')
  
  console.log('\n✅ Center button isolated test completed successfully')
}) 