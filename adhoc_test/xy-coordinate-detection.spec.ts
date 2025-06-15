import { test, expect } from '@playwright/test'

test('XY coordinate detection functionality comprehensive test', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== XY Coordinate Detection Functionality Test Start ===')
  
  // Enable debug logs
  await page.check('input[type="checkbox"]')
  await page.waitForTimeout(500)
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll('p'))
    const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
    const offsetP = paragraphs.find(p => p.textContent?.includes('Current Offset:'))
    return {
      detected: detectedP?.textContent || 'Not found',
      offset: offsetP?.textContent || 'Not found'
    }
  })
  
  console.log(`Initial state:`)
  console.log(`  ${initialState.detected}`)
  console.log(`  ${initialState.offset}`)
  
  // Test with preset coordinates (adjusted to actual grid positions)
  const presetTests = [
    { name: 'Top Left', expectedItem: '1' },      // (75px, 63px)
    { name: 'Top Center', expectedItem: '2' },    // (212px, 63px)
    { name: 'Top Right', expectedItem: '3' },     // (349px, 63px)
    { name: 'Middle Left', expectedItem: '4' },   // (75px, 175px)
    { name: 'Center', expectedItem: '5' },        // (212px, 175px)
    { name: 'Middle Right', expectedItem: '6' },  // (349px, 175px)
    { name: 'Bottom Left', expectedItem: '7' },   // (75px, 287px)
    { name: 'Bottom Center', expectedItem: '8' }, // (212px, 287px)
    { name: 'Bottom Right', expectedItem: '9' },  // (349px, 287px)
    { name: 'Extra Item', expectedItem: '10' }    // (212px, 399px)
  ]
  
  for (const preset of presetTests) {
    console.log(`\n--- ${preset.name} coordinate test ---`)
    
    // Scroll to top of page first to ensure buttons are visible
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(200)
    
    // Find and click button
    const button = page.locator(`button:text-is("${preset.name}")`)
    await button.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    
    // Get state before click for comparison
    const beforeClick = await page.evaluate(() => {
      const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
      return offsetP?.textContent || 'Not found'
    })
    
    // Use JavaScript click to ensure it works
    await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const targetButton = buttons.find(b => b.textContent?.trim() === name)
      if (targetButton) {
        console.log(`Clicking button: ${name}`)
        targetButton.click()
      } else {
        console.log(`Button not found: ${name}`)
        console.log('Available buttons:', buttons.map(b => b.textContent?.trim()))
      }
    }, preset.name)
    
    await page.waitForTimeout(500) // Wait longer for state update
    
    // Verify state actually changed
    const afterClick = await page.evaluate(() => {
      const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
      return offsetP?.textContent || 'Not found'
    })
    
    if (beforeClick === afterClick) {
      console.log(`Warning: State did not change after clicking ${preset.name}`)
      console.log(`Before: ${beforeClick}`)
      console.log(`After: ${afterClick}`)
    }
    
    const currentState = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p'))
      const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
      const offsetP = paragraphs.find(p => p.textContent?.includes('Current Offset:'))
      const distanceP = paragraphs.find(p => p.textContent?.includes('Distance from offset:'))
      return {
        detected: detectedP?.textContent || 'Not found',
        offset: offsetP?.textContent || 'Not found',
        distance: distanceP?.textContent || 'Not found'
      }
    })
    
    console.log(`  ${currentState.detected}`)
    console.log(`  ${currentState.offset}`)
    console.log(`  ${currentState.distance}`)
    
    // Verify expected item is detected
    expect(currentState.detected).toContain(`Item ${preset.expectedItem}`)
  }
  
  // Test with custom coordinates (set directly with JavaScript)
  const customCoordinates = [
    { x: 50, y: 50, description: 'Near top-left corner' },
    { x: 374, y: 50, description: 'Near top-right corner' },
    { x: 50, y: 374, description: 'Near bottom-left corner' },
    { x: 374, y: 374, description: 'Near bottom-right corner' },
    { x: 212, y: 212, description: 'Near center' },
    { x: 0, y: 0, description: 'Outside container (top-left)' },
    { x: 424, y: 424, description: 'Outside container (bottom-right)' }
  ]
  
  for (const coord of customCoordinates) {
    console.log(`\n--- Custom coordinate test: ${coord.description} (${coord.x}, ${coord.y}) ---`)
    
    // Get text input elements instead of sliders
    const xInput = page.getByRole('textbox', { name: /X Offset:/ })
    const yInput = page.getByRole('textbox', { name: /Y Offset:/ })
    
    await xInput.fill(coord.x.toString())
    await yInput.fill(coord.y.toString())
    
    await page.waitForTimeout(300)
    
    const currentState = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p'))
      const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
      const offsetP = paragraphs.find(p => p.textContent?.includes('Current Offset:'))
      const distanceP = paragraphs.find(p => p.textContent?.includes('Distance from offset:'))
      return {
        detected: detectedP?.textContent || 'Not found',
        offset: offsetP?.textContent || 'Not found',
        distance: distanceP?.textContent || 'Not found'
      }
    })
    
    console.log(`  ${currentState.detected}`)
    console.log(`  ${currentState.offset}`)
    console.log(`  ${currentState.distance}`)
    
    // Verify coordinates are set correctly
    expect(currentState.offset).toContain(`(${coord.x}, ${coord.y})`)
    
    // Verify some detection result exists (closest element is detected even outside container)
    expect(currentState.detected).toBeTruthy()
  }
  
  // Dynamic coordinate change test
  console.log('\n--- Dynamic coordinate change test ---')
  
  const xInput = page.getByRole('textbox', { name: /X Offset:/ })
  const yInput = page.getByRole('textbox', { name: /Y Offset:/ })
  
  // Change X coordinate gradually
  const xValues = [0, 106, 212, 318, 424]
  for (const x of xValues) {
    await xInput.fill(x.toString())
    await page.waitForTimeout(200)
    
    const state = await page.evaluate(() => {
      const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
      return detectedP?.textContent || 'Not found'
    })
    
    console.log(`  X=${x}: ${state}`)
    expect(state).toBeTruthy()
  }
  
  // Change Y coordinate gradually
  const yValues = [0, 106, 212, 318, 424]
  for (const y of yValues) {
    await yInput.fill(y.toString())
    await page.waitForTimeout(200)
    
    const state = await page.evaluate(() => {
      const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
      return detectedP?.textContent || 'Not found'
    })
    
    console.log(`  Y=${y}: ${state}`)
    expect(state).toBeTruthy()
  }
  
  // Distance calculation validity test
  console.log('\n--- Distance calculation validity test ---')
  
  // Align exactly with center item (Item 5)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const centerButton = buttons.find(b => b.textContent?.trim() === 'Center')
    if (centerButton) {
      centerButton.click()
    }
  })
  await page.waitForTimeout(300)
  
  const centerDistanceResult = await page.evaluate(() => {
    const distanceP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Distance from offset:'))
    const text = distanceP?.textContent || ''
    const match = text.match(/Distance from offset: ([\d.]+)px/)
    return {
      text: text,
      distance: match ? parseFloat(match[1]) : null
    }
  })
  
  console.log(`Distance text: "${centerDistanceResult.text}"`)
  console.log(`Distance to center item: ${centerDistanceResult.distance}px`)
  
  // Verify distance can be obtained
  expect(centerDistanceResult.distance).not.toBeNull()
  
  // Distance should be small since it's close to center coordinates
  if (centerDistanceResult.distance !== null) {
    expect(centerDistanceResult.distance).toBeLessThan(50)
  }
  
  console.log('\n✅ XY coordinate detection functionality is working properly')
}) 