import { test, expect } from '@playwright/test'

test('Manual coordinate setting test', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Manual Coordinate Setting Test ===')
  
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
  
  // Get text input elements instead of sliders
  const xInput = page.getByRole('textbox', { name: /X Offset:/ })
  const yInput = page.getByRole('textbox', { name: /Y Offset:/ })
  
  await xInput.fill('212')
  await page.waitForTimeout(200)
  await yInput.fill('175')
  await page.waitForTimeout(500)
  
  const afterManualSet = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found'
    }
  })
  
  console.log(`After manual setting: ${afterManualSet.offset} - ${afterManualSet.detected}`)
  
  // Expect Item 5 to be detected
  expect(afterManualSet.detected).toContain('Item 5')
  expect(afterManualSet.offset).toContain('(212, 175)')
  
  // Test other coordinates
  const testCoordinates = [
    { x: 75, y: 63, expectedItem: '1', name: 'Top Left' },
    { x: 349, y: 175, expectedItem: '6', name: 'Middle Right' },
    { x: 212, y: 287, expectedItem: '8', name: 'Bottom Center' }
  ]
  
  for (const coord of testCoordinates) {
    console.log(`\nTesting ${coord.name} coordinates (${coord.x}, ${coord.y})...`)
    
    await xInput.fill(coord.x.toString())
    await page.waitForTimeout(100)
    await yInput.fill(coord.y.toString())
    await page.waitForTimeout(300)
    
    const testState = await page.evaluate(() => {
      const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
      const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
      return {
        offset: offsetP?.textContent || 'Not found',
        detected: detectedP?.textContent || 'Not found'
      }
    })
    
    console.log(`  Result: ${testState.offset} - ${testState.detected}`)
    expect(testState.detected).toContain(`Item ${coord.expectedItem}`)
    expect(testState.offset).toContain(`(${coord.x}, ${coord.y})`)
  }
  
  console.log('\n✅ Manual coordinate setting test completed successfully')
}) 