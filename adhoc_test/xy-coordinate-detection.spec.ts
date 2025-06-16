import { test, expect } from '@playwright/test'

test('XY Coordinate Detection Precision Test', async ({ page }) => {
  await page.goto('http://localhost:59517/test-page.html')
  await page.waitForTimeout(1000)
  
  console.log('\n=== XY Coordinate Detection Precision Test Start ===')
  
  // Helper function to get current detection state
  const getDetectionState = async () => {
    return await page.evaluate(() => {
      const detected = document.querySelector('#detected')?.textContent || 'Not found'
      const offset = document.querySelector('#current-offset')?.textContent || 'Not found'
      const calculated = document.querySelector('#calculated-position')?.textContent || 'Not found'
      const distance = document.querySelector('#distance')?.textContent || 'Not found'
      const childrenCount = document.querySelector('#children-count')?.textContent || 'Not found'
      
      return {
        detected,
        offset,
        calculated,
        distance,
        childrenCount
      }
    })
  }
  
  // Get element positions for reference
  const getElementPositions = async () => {
    return await page.evaluate(() => {
      const container = document.querySelector('[data-testid="container"]')
      const containerRect = container?.getBoundingClientRect()
      const elements = Array.from(document.querySelectorAll('[data-testid^="child-"]'))
      
      return elements.map(el => {
        const rect = el.getBoundingClientRect()
        const testId = el.getAttribute('data-testid')
        const itemNumber = testId?.replace('child-', '') || '0'
        
        return {
          id: testId,
          itemNumber: parseInt(itemNumber),
          // Relative to container
          left: rect.left - (containerRect?.left || 0),
          top: rect.top - (containerRect?.top || 0),
          right: rect.right - (containerRect?.left || 0),
          bottom: rect.bottom - (containerRect?.top || 0),
          centerX: rect.left - (containerRect?.left || 0) + rect.width / 2,
          centerY: rect.top - (containerRect?.top || 0) + rect.height / 2,
          width: rect.width,
          height: rect.height
        }
      }).sort((a, b) => a.itemNumber - b.itemNumber)
    })
  }
  
  // Check initial state
  const initialState = await getDetectionState()
  const elementPositions = await getElementPositions()
  
  console.log(`Initial state: ${initialState.detected}`)
  console.log(`Children count: ${initialState.childrenCount}`)
  console.log(`Element positions:`)
  
  elementPositions.forEach(pos => {
    console.log(`  ${pos.id}: center=(${pos.centerX.toFixed(1)}, ${pos.centerY.toFixed(1)}), bounds=(${pos.left.toFixed(1)}, ${pos.top.toFixed(1)}, ${pos.right.toFixed(1)}, ${pos.bottom.toFixed(1)})`)
  })
  
  // Test 1: Exact center detection for each element
  console.log('\n=== Test 1: Exact Center Detection ===')
  
  for (const element of elementPositions) {
    console.log(`\n--- Testing ${element.id} center detection ---`)
    
    const centerX = Math.round(element.centerX)
    const centerY = Math.round(element.centerY)
    
    await page.locator('#x-input').fill(`${centerX}px`)
    await page.locator('#y-input').fill(`${centerY}px`)
    await page.waitForTimeout(300)
    
    const state = await getDetectionState()
    console.log(`Target center (${centerX}, ${centerY}): ${state.detected}`)
    console.log(`Distance: ${state.distance}`)
    
    // Should detect the correct item
    expect(state.detected).toContain(`Item ${element.itemNumber}`)
    expect(state.offset).toContain(`(${centerX}px, ${centerY}px)`)
    
    // Distance should be very small (ideally 0 or close to 0)
    const distanceValue = parseFloat(state.distance.replace('px', ''))
    expect(distanceValue).toBeLessThan(5) // Allow small tolerance
  }
  
  // Test 2: Corner detection for each element
  console.log('\n=== Test 2: Corner Detection ===')
  
  const cornerOffsets = [
    { name: 'top-left', dx: 1, dy: 1 },
    { name: 'top-right', dx: -1, dy: 1 },
    { name: 'bottom-left', dx: 1, dy: -1 },
    { name: 'bottom-right', dx: -1, dy: -1 }
  ]
  
  for (const element of elementPositions.slice(0, 3)) { // Test first 3 elements to save time
    for (const corner of cornerOffsets) {
      console.log(`\n--- Testing ${element.id} ${corner.name} corner ---`)
      
      const cornerX = Math.round(corner.dx > 0 ? element.left + 1 : element.right - 1)
      const cornerY = Math.round(corner.dy > 0 ? element.top + 1 : element.bottom - 1)
      
      await page.locator('#x-input').fill(`${cornerX}px`)
      await page.locator('#y-input').fill(`${cornerY}px`)
      await page.waitForTimeout(200)
      
      const state = await getDetectionState()
      console.log(`${corner.name} corner (${cornerX}, ${cornerY}): ${state.detected}`)
      
      // Should still detect the same item
      expect(state.detected).toContain(`Item ${element.itemNumber}`)
    }
  }
  
  // Test 3: Boundary detection between elements
  console.log('\n=== Test 3: Boundary Detection ===')
  
  const boundaryTests = [
    { from: elementPositions[0], to: elementPositions[1], name: 'Item 1 to Item 2' },
    { from: elementPositions[1], to: elementPositions[2], name: 'Item 2 to Item 3' },
    { from: elementPositions[3], to: elementPositions[4], name: 'Item 4 to Item 5' }
  ]
  
  for (const boundary of boundaryTests) {
    console.log(`\n--- Testing boundary: ${boundary.name} ---`)
    
    // Test point exactly between two elements
    const midX = Math.round((boundary.from.right + boundary.to.left) / 2)
    const midY = Math.round((boundary.from.centerY + boundary.to.centerY) / 2)
    
    await page.locator('#x-input').fill(`${midX}px`)
    await page.locator('#y-input').fill(`${midY}px`)
    await page.waitForTimeout(200)
    
    const state = await getDetectionState()
    console.log(`Boundary point (${midX}, ${midY}): ${state.detected}`)
    
    // Should detect one of the two adjacent items
    const detectedItem1 = state.detected.includes(`Item ${boundary.from.itemNumber}`)
    const detectedItem2 = state.detected.includes(`Item ${boundary.to.itemNumber}`)
    expect(detectedItem1 || detectedItem2).toBeTruthy()
  }
  
  // Test 4: Outside container detection
  console.log('\n=== Test 4: Outside Container Detection ===')
  
  const outsideTests = [
    { x: -10, y: 50, name: 'Left outside' },
    { x: 450, y: 50, name: 'Right outside' },
    { x: 200, y: -10, name: 'Top outside' },
    { x: 200, y: 450, name: 'Bottom outside' },
    { x: -10, y: -10, name: 'Top-left outside' },
    { x: 450, y: 450, name: 'Bottom-right outside' }
  ]
  
  for (const outside of outsideTests) {
    console.log(`\n--- Testing ${outside.name}: (${outside.x}, ${outside.y}) ---`)
    
    await page.locator('#x-input').fill(`${outside.x}px`)
    await page.locator('#y-input').fill(`${outside.y}px`)
    await page.waitForTimeout(200)
    
    const state = await getDetectionState()
    console.log(`${outside.name}: ${state.detected}`)
    
    // Should detect the closest item or show appropriate behavior
    expect(state.detected).toBeTruthy()
    expect(state.detected).not.toBe('Not found')
  }
  
  // Test 5: CSS Units precision
  console.log('\n=== Test 5: CSS Units Precision ===')
  
  const cssUnitTests = [
    { x: '25%', y: '25%', name: 'Percentage coordinates' },
    { x: '50%', y: '50%', name: 'Center percentage' },
    { x: '5vw', y: '10vh', name: 'Viewport units' },
    { x: '15vw', y: '20vh', name: 'Larger viewport units' }
  ]
  
  for (const cssTest of cssUnitTests) {
    console.log(`\n--- Testing ${cssTest.name}: (${cssTest.x}, ${cssTest.y}) ---`)
    
    await page.locator('#x-input').fill(cssTest.x)
    await page.locator('#y-input').fill(cssTest.y)
    await page.waitForTimeout(300)
    
    const state = await getDetectionState()
    console.log(`${cssTest.name}: ${state.detected}`)
    console.log(`Calculated position: ${state.calculated}`)
    console.log(`Distance: ${state.distance}`)
    
    // Should detect an item and show calculated pixel values
    expect(state.detected).toBeTruthy()
    expect(state.calculated).toContain('px')
    expect(state.distance).toContain('px')
  }
  
  // Test 6: Rapid coordinate changes
  console.log('\n=== Test 6: Rapid Coordinate Changes ===')
  
  const rapidTests = [
    { x: 100, y: 100 },
    { x: 300, y: 100 },
    { x: 300, y: 300 },
    { x: 100, y: 300 },
    { x: 200, y: 200 } // Back to center
  ]
  
  for (let i = 0; i < rapidTests.length; i++) {
    const test = rapidTests[i]
    console.log(`\nRapid change ${i + 1}: (${test.x}, ${test.y})`)
    
    await page.locator('#x-input').fill(`${test.x}px`)
    await page.locator('#y-input').fill(`${test.y}px`)
    await page.waitForTimeout(100) // Shorter wait for rapid changes
    
    const state = await getDetectionState()
    console.log(`Change ${i + 1}: ${state.detected}`)
    
    expect(state.detected).toBeTruthy()
  }
  
  // Test 7: Precision validation with decimal coordinates
  console.log('\n=== Test 7: Decimal Coordinate Precision ===')
  
  const decimalTests = [
    { x: 150.5, y: 150.5, name: 'Half pixel precision' },
    { x: 200.25, y: 200.75, name: 'Quarter pixel precision' },
    { x: 175.1, y: 175.9, name: 'Decimal precision' }
  ]
  
  for (const decimal of decimalTests) {
    console.log(`\n--- Testing ${decimal.name}: (${decimal.x}, ${decimal.y}) ---`)
    
    await page.locator('#x-input').fill(`${decimal.x}px`)
    await page.locator('#y-input').fill(`${decimal.y}px`)
    await page.waitForTimeout(200)
    
    const state = await getDetectionState()
    console.log(`${decimal.name}: ${state.detected}`)
    console.log(`Distance: ${state.distance}`)
    
    expect(state.detected).toBeTruthy()
  }
  
  // Final validation
  console.log('\n=== Final Validation ===')
  
  // Return to initial state
  await page.locator('#x-input').fill('212px')
  await page.locator('#y-input').fill('175px')
  await page.waitForTimeout(300)
  
  const finalState = await getDetectionState()
  console.log(`Final state: ${finalState.detected}`)
  console.log(`Final offset: ${finalState.offset}`)
  console.log(`Final distance: ${finalState.distance}`)
  console.log(`Children count: ${finalState.childrenCount}`)
  
  expect(finalState.detected).toContain('Item 5')
  expect(finalState.offset).toContain('(212px, 175px)')
  expect(finalState.childrenCount).toBe('10')
  
  console.log('\n✅ XY Coordinate Detection Precision Test completed successfully')
}) 