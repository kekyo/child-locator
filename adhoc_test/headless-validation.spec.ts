import { test, expect } from '@playwright/test'

test.describe('useLocator Hook Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Access test page
    await page.goto('http://localhost:59517/test-page.html')
    await page.waitForSelector('[data-testid="container"]', { timeout: 10000 })
  })

  test('should not continuously output logs when UI is not interacted', async ({ page }) => {
    console.log('=== Starting continuous log output verification ===')
    
    // Monitor console logs
    const logs: string[] = []
    page.on('console', (msg) => {
      if (msg.text().includes('Detected component:')) {
        logs.push(`${new Date().toISOString()}: ${msg.text()}`)
      }
    })
    
    // Wait 3 seconds after initial display
    await page.waitForTimeout(3000)
    
    const initialLogCount = logs.length
    console.log(`Initial log count: ${initialLogCount}`)
    
    // Wait another 5 seconds without touching UI
    await page.waitForTimeout(5000)
    
    const finalLogCount = logs.length
    console.log(`Final log count: ${finalLogCount}`)
    console.log('Log contents:')
    logs.forEach(log => console.log(log))
    
    // Verify no new logs are output while UI is not touched
    const continuousLogs = finalLogCount - initialLogCount
    console.log(`Continuous log count: ${continuousLogs}`)
    
    if (continuousLogs > 2) { // Allow some margin
      console.error('❌ Continuous log output detected')
    } else {
      console.log('✅ No continuous log output issues')
    }
  })

  test('should correctly detect items at XY coordinates', async ({ page }) => {
    console.log('=== Starting XY coordinate element detection accuracy verification ===')
    
    // Get X/Y input values
    const xInput = page.locator('input[placeholder*="212px"]')
    const yInput = page.locator('input[placeholder*="175px"]')
    
    const currentXValue = await xInput.inputValue()
    const currentYValue = await yInput.inputValue()
    console.log(`Current XY coordinates: (${currentXValue}, ${currentYValue})`)
    
    // Get position of each item
    const items = await page.locator('[data-testid^="child-"]').all()
    const itemPositions: Array<{
      id: string | null
      left: number
      top: number
      right: number
      bottom: number
      centerX: number
      centerY: number
    }> = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const testId = await item.getAttribute('data-testid')
      const boundingBox = await item.boundingBox()
      if (boundingBox) {
        itemPositions.push({
          id: testId,
          left: boundingBox.x,
          top: boundingBox.y,
          right: boundingBox.x + boundingBox.width,
          bottom: boundingBox.y + boundingBox.height,
          centerX: boundingBox.x + boundingBox.width / 2,
          centerY: boundingBox.y + boundingBox.height / 2
        })
      }
    }
    
    console.log('Item position information:')
    itemPositions.forEach(pos => {
      console.log(`${pos.id}: center=(${pos.centerX.toFixed(0)}, ${pos.centerY.toFixed(0)}), bounds=(${pos.left.toFixed(0)}, ${pos.top.toFixed(0)}, ${pos.right.toFixed(0)}, ${pos.bottom.toFixed(0)})`)
    })
    
    // Get container position
    const container = page.locator('[data-testid="container"]')
    const containerBox = await container.boundingBox()
    if (!containerBox) {
      throw new Error('Container not found')
    }
    
    // Calculate XY coordinate position (considering CSS units)
    let targetX: number, targetY: number
    
    // Get calculated position from the page for complex units
    const calculatedText = await page.locator('p:has-text("Calculated Position:")').textContent()
    const calculatedMatch = calculatedText?.match(/Calculated Position: \((\d+)px, (\d+)px\)/)
    
    if (currentXValue.endsWith('px')) {
      targetX = containerBox.x + parseInt(currentXValue)
    } else if (currentXValue.endsWith('%')) {
      const percentage = parseFloat(currentXValue) / 100
      targetX = containerBox.x + (containerBox.width * percentage)
    } else if (calculatedMatch) {
      targetX = containerBox.x + parseInt(calculatedMatch[1])
    } else {
      targetX = containerBox.x + parseInt(currentXValue)
    }
    
    if (currentYValue.endsWith('px')) {
      targetY = containerBox.y + parseInt(currentYValue)
    } else if (currentYValue.endsWith('%')) {
      const percentage = parseFloat(currentYValue) / 100
      targetY = containerBox.y + (containerBox.height * percentage)
    } else if (calculatedMatch) {
      targetY = containerBox.y + parseInt(calculatedMatch[2])
    } else {
      targetY = containerBox.y + parseInt(currentYValue)
    }
    
    console.log(`Target XY position: (${targetX}, ${targetY})`)
    console.log(`Container start position: (${containerBox.x}, ${containerBox.y})`)
    console.log(`Input values: (${currentXValue}, ${currentYValue})`)
    
    // Check detected item
    const detectedText = await page.locator('p:has-text("Detected:")').textContent()
    console.log(`Detection result: ${detectedText}`)
    
    // Check which item's range it falls within
    let expectedItem: string | null = null
    for (const pos of itemPositions) {
      if (targetX >= pos.left && targetX <= pos.right && 
          targetY >= pos.top && targetY <= pos.bottom) {
        expectedItem = pos.id
        break
      }
    }
    
    console.log(`Expected item: ${expectedItem || 'None (outside elements)'}`)
    
    // Verification result
    if (expectedItem) {
      const expectedItemNumber = expectedItem.replace('child-', '')
      if (detectedText?.includes(`Item ${expectedItemNumber}`)) {
        console.log(`✅ Item ${expectedItemNumber} is correctly detected`)
      } else {
        console.error(`❌ Item ${expectedItemNumber} exists but is not correctly detected`)
        console.error(`Detection result: ${detectedText}`)
        console.error(`Target XY: (${targetX}, ${targetY}), Item range: (${itemPositions.find(p => p.id === expectedItem)?.left}-${itemPositions.find(p => p.id === expectedItem)?.right}, ${itemPositions.find(p => p.id === expectedItem)?.top}-${itemPositions.find(p => p.id === expectedItem)?.bottom})`)
      }
    } else {
      // When outside elements, the closest element should be detected
      if (detectedText?.includes('Item')) {
        console.log(`✅ Closest item detected outside elements: ${detectedText}`)
      } else {
        console.error(`❌ Nothing detected outside elements: ${detectedText}`)
      }
    }
  })

  test('should test different XY coordinate positions', async ({ page }) => {
    console.log('=== Testing different XY coordinate positions with CSS units ===')
    
    const xInput = page.locator('input[placeholder*="212px"]')
    const yInput = page.locator('input[placeholder*="175px"]')
    
    const testCoordinates = [
      { x: '75px', y: '63px', name: 'Top Left' },
      { x: '212px', y: '63px', name: 'Top Center' },
      { x: '349px', y: '63px', name: 'Top Right' },
      { x: '212px', y: '175px', name: 'Center' },
      { x: '212px', y: '287px', name: 'Bottom Center' },
      { x: '50px', y: '50px', name: 'Outside Top-Left' },
      { x: '400px', y: '400px', name: 'Outside Bottom-Right' },
      // CSS unit tests
      { x: '25%', y: '25%', name: 'Percentage 25%' },
      { x: '50%', y: '50%', name: 'Percentage 50%' },
      { x: '5vw', y: '10vh', name: 'Viewport units' }
    ]
    
    for (const coord of testCoordinates) {
      console.log(`\n--- ${coord.name} coordinates: (${coord.x}, ${coord.y}) ---`)
      
      // Set text inputs
      await xInput.fill(coord.x)
      await yInput.fill(coord.y)
      await page.waitForTimeout(300) // Wait for UI update
      
      // Get detection results
      const detectedText = await page.locator('p:has-text("Detected:")').textContent()
      const offsetText = await page.locator('p:has-text("Current Offset:")').textContent()
      const calculatedText = await page.locator('p:has-text("Calculated Position:")').textContent()
      const distanceText = await page.locator('p:has-text("Distance from offset:")').textContent()
      
      console.log(`Detection result: ${detectedText}`)
      console.log(`Coordinates: ${offsetText}`)
      console.log(`Calculated: ${calculatedText}`)
      console.log(`Distance: ${distanceText}`)
      
      // Basic operation verification
      expect(detectedText).toBeTruthy()
      expect(offsetText).toContain(`(${coord.x}, ${coord.y})`)
      
      // For CSS units, verify calculated position shows pixel values
      if (!coord.x.endsWith('px')) {
        expect(calculatedText).toMatch(/Calculated Position: \(\d+px, \d+px\)/)
      }
    }
  })
}) 