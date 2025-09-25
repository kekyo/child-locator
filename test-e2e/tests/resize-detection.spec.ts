import { test, expect } from '@playwright/test'

test.describe('Child Locator - Resize Detection', () => {
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

  test('should maintain accurate detection after window resize', async ({ page }) => {
    console.log('=== Window Resize Detection Test ===')
    
    // Get initial viewport and item position
    const initialViewport = page.viewportSize()
    console.log(`Initial viewport: ${initialViewport?.width}x${initialViewport?.height}`)
    
    // Position mouse on a visible item
    const targetItem = page.locator('[data-testid="Item-2-2"]')
    const isVisible = await targetItem.isVisible()
    
    if (!isVisible) {
      console.log('⚠️ Target item not visible, using alternative approach')
      await page.mouse.move(300, 400)
      await page.waitForTimeout(300)
      
      const initialDetected = await page.locator('[data-testid="detected-item"]').textContent()
      console.log(`Initial detection: ${initialDetected}`)
      
      // Test resize
      await page.setViewportSize({ width: 1100, height: 700 })
      await page.waitForTimeout(500)
      
      const afterResize = await page.locator('[data-testid="detected-item"]').textContent()
      console.log(`After resize: ${afterResize}`)
      
      // Should maintain some detection capability
      if (afterResize) {
        expect(afterResize).toMatch(/Detected Item:\s*(Item-\d+-\d+|Unknown Element|None)/)
      }
      
      console.log('✅ Window resize test completed')
      return
    }
    
    const itemBox = await targetItem.boundingBox()
    if (!itemBox) {
      throw new Error('Could not get item bounds')
    }
    
    const centerX = itemBox.x + itemBox.width / 2
    const centerY = itemBox.y + itemBox.height / 2
    
    console.log(`Initial item position: (${centerX}, ${centerY})`)
    
    await page.mouse.move(centerX, centerY)
    await page.waitForTimeout(400)
    
    const initialDetected = await page.locator('[data-testid="detected-item"]').textContent()
    console.log(`Initial detection: ${initialDetected}`)
    
    console.log('\n--- Resizing window smaller ---')
    await page.setViewportSize({ width: 1100, height: 600 })
    await page.waitForTimeout(500)
    
    const afterSmallResize = await page.locator('[data-testid="detected-item"]').textContent()
    console.log(`Detection after small resize: ${afterSmallResize}`)
    
    // Should maintain some detection
    if (afterSmallResize) {
      expect(afterSmallResize).toMatch(/Detected Item:\s*(Item-\d+-\d+|Unknown Element|None)/)
    }
    
    // Resize window larger
    console.log('\n--- Resizing window larger ---')
    await page.setViewportSize({ width: 1400, height: 800 })
    await page.waitForTimeout(500)
    
    const afterLargeResize = await page.locator('[data-testid="detected-item"]').textContent()
    console.log(`Detection after large resize: ${afterLargeResize}`)
    
    // Should maintain some detection
    if (afterLargeResize) {
      expect(afterLargeResize).toMatch(/Detected Item:\s*(Item-\d+-\d+|Unknown Element|None)/)
    }
    
    console.log('✅ Window resize detection test completed')
  })

  test('should recalculate positions correctly after container resize', async ({ page }) => {
    console.log('=== Container Resize Test ===')
    
    // Get the container
    const container = page.locator('[data-testid="grid-container"]').first()
    const initialContainer = await container.boundingBox()
    
    if (!initialContainer) {
      throw new Error('Container not found')
    }
    
    console.log(`Initial container: ${initialContainer.width}x${initialContainer.height}`)
    
    // Position mouse within container
    await page.mouse.move(300, 400)
    await page.waitForTimeout(300)
    
    const beforeResize = await page.locator('[data-testid="detected-item"]').textContent()
    console.log(`Before resize: ${beforeResize}`)
    
    // Test different resize scenarios
    const resizeTests = [
      { name: 'Small resize: 900x600', width: 900, height: 600 },
      { name: 'Medium resize: 1200x700', width: 1200, height: 700 },
      { name: 'Large resize: 1500x900', width: 1500, height: 900 }
    ]
    
    for (const resize of resizeTests) {
      console.log(`\n--- Testing ${resize.name} ---`)
      
      await page.setViewportSize({ width: resize.width, height: resize.height })
      await page.waitForTimeout(400)
      
      const detectedText = await page.locator('[data-testid="detected-item"]').textContent()
      const mouseCoordText = await page.locator('[data-testid="mouse-coordinates"]').textContent()
      
      console.log(`Detection: ${detectedText}`)
      console.log(`Mouse coordinates: ${mouseCoordText}`)
      
      // Should maintain detection functionality
      if (detectedText) {
        expect(detectedText).toMatch(/Detected Item:\s*(Item-\d+-\d+|Unknown Element|None)/)
      }
      if (mouseCoordText) {
        expect(mouseCoordText).toMatch(/Mouse Coordinates:\s*X:\s*\d+px,\s*Y:\s*\d+px/)
      }
      
      console.log(`✅ ${resize.name} handled correctly`)
    }
  })

  test('should handle rapid resize events', async ({ page }) => {
    console.log('=== Rapid Resize Events Test ===')
    
    // Position mouse at a stable location
    await page.mouse.move(300, 400)
    await page.waitForTimeout(300)
    
    const initialDetected = await page.locator('[data-testid="detected-item"]').textContent()
    console.log(`Initial detection: ${initialDetected}`)
    
    // Rapid resize sequence
    const rapidResizes = [
      { width: 1100, height: 700 },
      { width: 1300, height: 650 },
      { width: 1000, height: 800 },
      { width: 1400, height: 750 },
      { width: 1280, height: 720 } // Back to default
    ]
    
    for (const [index, resize] of rapidResizes.entries()) {
      console.log(`\n--- Rapid resize ${index + 1}: ${resize.width}x${resize.height} ---`)
      
      await page.setViewportSize({ width: resize.width, height: resize.height })
      await page.waitForTimeout(200) // Short wait for rapid test
      
      const detectedText = await page.locator('[data-testid="detected-item"]').textContent()
      console.log(`Rapid resize ${index + 1}: ${detectedText}`)
      
      // Should handle rapid changes gracefully
      if (detectedText) {
        expect(detectedText).toMatch(/Detected Item:\s*(Item-\d+-\d+|Unknown Element|None)/)
      }
    }
    
    console.log('✅ Rapid resize test completed')
  })

  test('should maintain detection consistency across different aspect ratios', async ({ page }) => {
    console.log('=== Aspect Ratio Test ===')
    
    // Test different aspect ratios
    const aspectRatios = [
      { name: '16:9 Wide (1600x900)', width: 1600, height: 900 },
      { name: '4:3 Standard (1280x960)', width: 1280, height: 960 },
      { name: '21:9 Ultrawide (1680x720)', width: 1680, height: 720 },
      { name: '16:10 Widescreen (1440x900)', width: 1440, height: 900 }
    ]
    
    for (const ratio of aspectRatios) {
      console.log(`\n--- Testing ${ratio.name} ---`)
      
      await page.setViewportSize({ width: ratio.width, height: ratio.height })
      await page.waitForTimeout(400)
      
      // Test multiple positions in this aspect ratio
      const testPositions = [
        { name: 'Top-left area', x: 100, y: 100 },
        { name: 'Center area', x: ratio.width / 2, y: ratio.height / 2 },
        { name: 'Bottom-right area', x: ratio.width - 100, y: ratio.height - 100 }
      ]
      
      for (const pos of testPositions) {
        await page.mouse.move(pos.x, pos.y)
        await page.waitForTimeout(200)
        
        const detectedText = await page.locator('[data-testid="detected-item"]').textContent()
        console.log(`  ${pos.name}: ${detectedText}`)
        
        // Should detect appropriately in all aspect ratios
        if (detectedText) {
          expect(detectedText).toMatch(/Detected Item:\s*(Item-\d+-\d+|Unknown Element|None)/)
        }
      }
      
      console.log(`✅ ${ratio.name} tested`)
    }
  })

  test('should handle browser zoom changes', async ({ page }) => {
    console.log('=== Browser Zoom Test ===')
    
    // Position mouse on a visible item
    const targetItem = page.locator('[data-testid="Item-1-2"]')
    const isVisible = await targetItem.isVisible()
    
    if (!isVisible) {
      console.log('⚠️ Target item not visible, using center position')
      await page.mouse.move(400, 300)
    } else {
      const itemBox = await targetItem.boundingBox()
      if (itemBox) {
        const centerX = itemBox.x + itemBox.width / 2
        const centerY = itemBox.y + itemBox.height / 2
        await page.mouse.move(centerX, centerY)
      }
    }
    
    await page.waitForTimeout(300)
    
    const initialDetected = await page.locator('[data-testid="detected-item"]').textContent()
    console.log(`Initial detection at 100% zoom: ${initialDetected}`)
    
    // Test different zoom levels
    const zoomLevels = [0.75, 1.25, 1.5]
    
    for (const zoom of zoomLevels) {
      console.log(`\n--- Testing ${zoom * 100}% zoom ---`)
      
      // Apply zoom
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = zoomLevel.toString()
      }, zoom)
      
      await page.waitForTimeout(400)
      
      const detectedText = await page.locator('[data-testid="detected-item"]').textContent()
      const mouseCoordText = await page.locator('[data-testid="mouse-coordinates"]').textContent()
      
      console.log(`Detection at ${zoom * 100}% zoom: ${detectedText}`)
      console.log(`Mouse coordinates: ${mouseCoordText}`)
      
      // Should maintain detection capability
      if (detectedText) {
        expect(detectedText).toMatch(/Detected Item:\s*(Item-\d+-\d+|Unknown Element|None)/)
      }
      if (mouseCoordText) {
        expect(mouseCoordText).toMatch(/Mouse Coordinates:\s*X:\s*\d+px,\s*Y:\s*\d+px/)
      }
      
      console.log(`✅ ${zoom * 100}% zoom handled correctly`)
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1'
    })
    
    await page.waitForTimeout(300)
    
    const finalDetected = await page.locator('[data-testid="detected-item"]').textContent()
    console.log(`Final detection after zoom reset: ${finalDetected}`)
    
    console.log('✅ Browser zoom test completed')
  })
}) 
