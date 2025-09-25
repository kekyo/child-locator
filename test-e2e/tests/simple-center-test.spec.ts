import { test, expect } from '@playwright/test'

test.describe('Child Locator - Simple Center Test', () => {
  test.beforeEach(async ({ page }) => {
    // Load the actual React app with child-locator
    await page.goto('http://localhost:59517/')
    const elementScrollButton = page.getByRole('button', { name: 'Element scroll' })
    await elementScrollButton.waitFor({ timeout: 10000 })
    if (!(await elementScrollButton.isDisabled())) {
      await elementScrollButton.click()
    }

    await page.waitForSelector('[data-testid^="Item-"]', { timeout: 10000 })
    await page.waitForSelector('[data-testid="detected-item"]', { timeout: 10000 })
    
    // Wait for child-locator initialization
    await page.waitForTimeout(500)
  })

  test('should detect grid items at their center positions', async ({ page }) => {
    console.log('=== Simple Center Detection Test ===')
    
    // Test center detection for first few grid items
    const testItems = [
      { testId: 'Item-1-1', name: 'Item-1-1' },
      { testId: 'Item-1-2', name: 'Item-1-2' },
      { testId: 'Item-1-3', name: 'Item-1-3' },
      { testId: 'Item-2-1', name: 'Item-2-1' },
      { testId: 'Item-2-2', name: 'Item-2-2' }
    ]
    
    for (const item of testItems) {
      console.log(`\n--- Testing ${item.name} center detection ---`)
      
      // Get the item's bounding box
      const itemLocator = page.locator(`[data-testid="${item.testId}"]`)
      const boundingBox = await itemLocator.boundingBox()
      
      if (boundingBox) {
        // Calculate center position
        const centerX = boundingBox.x + boundingBox.width / 2
        const centerY = boundingBox.y + boundingBox.height / 2
        
        console.log(`${item.name} center: (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`)
        console.log(`${item.name} bounds: ${boundingBox.width}x${boundingBox.height} at (${boundingBox.x}, ${boundingBox.y})`)
        
        // Move mouse to center
        await page.mouse.move(centerX, centerY)
        await page.waitForTimeout(300)
        
        // Check child-locator detection
        const detectedText = await page.locator('[data-testid="detected-item"]').textContent()
        const mouseCoordText = await page.locator('[data-testid="mouse-coordinates"]').textContent()
        const boundsText = await page.locator('[data-testid="element-bounds"]').textContent()
        
        console.log(`Detection result: ${detectedText}`)
        console.log(`Mouse coordinates: ${mouseCoordText}`)
        console.log(`Element bounds: ${boundsText}`)
        
        // Verify correct detection
        expect(detectedText).toContain(item.name)
        
        // Verify mouse coordinates are captured
        expect(mouseCoordText).toMatch(/Mouse Coordinates:\s*X:\s*\d+px,\s*Y:\s*\d+px/)
        
        // Verify element bounds are provided
        expect(boundsText).toMatch(/Element Bounds:\s*\d+x\d+\s*at\s*\(\d+,\s*\d+\)/)
        
        console.log(`✅ ${item.name} center detection successful`)
      } else {
        console.log(`❌ Could not get bounding box for ${item.name}`)
      }
    }
    
    console.log('\n✅ Simple center detection test completed')
  })

  test('should provide accurate distance measurements at center', async ({ page }) => {
    console.log('=== Center Distance Accuracy Test ===')
    
    // Test a specific item for distance accuracy
    const targetItem = page.locator('[data-testid="Item-2-2"]')
    const boundingBox = await targetItem.boundingBox()
    
    if (boundingBox) {
      const centerX = boundingBox.x + boundingBox.width / 2
      const centerY = boundingBox.y + boundingBox.height / 2
      
      console.log(`Item-2-2 center: (${centerX}, ${centerY})`)
      
      // Move to exact center
      await page.mouse.move(centerX, centerY)
      await page.waitForTimeout(300)
      
      const detectedText = await page.locator('[data-testid="detected-item"]').textContent()
      
      console.log(`Detection at center: ${detectedText}`)
      
      // Should detect Item-2-2
      expect(detectedText).toContain('Item-2-2')
      
      // Extract distance if available in the detection text
      const distanceMatch = detectedText?.match(/Distance:\s*([\d.]+)px/)
      if (distanceMatch) {
        const distance = parseFloat(distanceMatch[1])
        console.log(`Distance from center: ${distance}px`)
        
        // Distance should be very small at the center (ideally 0 or close to 0)
        expect(distance).toBeLessThanOrEqual(5) // Allow small tolerance
      }
      
      console.log('✅ Center distance accuracy verified')
    }
  })
}) 
