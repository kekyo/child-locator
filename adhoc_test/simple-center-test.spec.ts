import { test, expect } from '@playwright/test'

test('Simple Center button test', async ({ page }) => {
  // Use the same boundary test page that works correctly
  await page.goto('/boundary-test.html')
  await page.waitForTimeout(1000)
  
  console.log('=== Simple Center Button Test (using boundary-test.html) ===')
  
  // Check viewport size
  const viewportSize = page.viewportSize()
  console.log(`Viewport size: ${viewportSize?.width}x${viewportSize?.height}`)
  
  // Test center position detection for child-5 (which should be at center)
  const result = await page.evaluate(() => {
    // Get the container and child-5 element
    const container = document.querySelector('[data-testid="content-container"]') as HTMLElement
    const child5 = document.querySelector('[data-testid="child-5"]') as HTMLElement
    
    if (!container || !child5) {
      return { error: 'Container or child-5 not found' }
    }
    
    // Get child-5's center position
    const rect = child5.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    
    // Calculate relative position within container
    const centerX = rect.left + rect.width / 2 - containerRect.left
    const centerY = rect.top + rect.height / 2 - containerRect.top
    
    return {
      centerX: Math.round(centerX),
      centerY: Math.round(centerY),
      child5Text: child5.textContent
    }
  })
  
  console.log(`Child-5 center position: (${result.centerX}, ${result.centerY})`)
  console.log(`Child-5 text: ${result.child5Text}`)
  
  // Check for errors
  if ('error' in result) {
    throw new Error(result.error)
  }
  
  // Verify that child-5 is detected at its center position
  const detectionResult = await page.evaluate((coords: { centerX: number; centerY: number }) => {
    const container = document.querySelector('[data-testid="content-container"]') as HTMLElement
    const containerRect = container.getBoundingClientRect()
    
    // Calculate absolute coordinates
    const targetX = containerRect.left + coords.centerX
    const targetY = containerRect.top + coords.centerY
    
    // Use document.elementFromPoint to detect element
    const element = document.elementFromPoint(targetX, targetY)
    
    return {
      targetX,
      targetY,
      detectedElement: element ? {
        tagName: element.tagName,
        testId: element.getAttribute('data-testid'),
        textContent: element.textContent
      } : null
    }
  }, { centerX: result.centerX, centerY: result.centerY })
  
  console.log(`Detection at (${detectionResult.targetX}, ${detectionResult.targetY}):`, detectionResult.detectedElement)
  
  // Expect child-5 to be detected
  expect(detectionResult.detectedElement?.testId).toBe('child-5')
  expect(detectionResult.detectedElement?.textContent).toContain('Child Element 5')
}) 