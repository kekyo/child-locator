import { test, expect } from '@playwright/test'

test('Final resize detection functionality verification', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Final Resize Detection Functionality Test ===')
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll('p'))
    const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
    const windowSizeP = paragraphs.find(p => p.textContent?.includes('Window Size:'))
    const containerSizeP = paragraphs.find(p => p.textContent?.includes('Container Size:'))
    return {
      detected: detectedP?.textContent || 'Not found',
      windowSize: windowSizeP?.textContent || 'Not found',
      containerSize: containerSizeP?.textContent || 'Not found'
    }
  })
  
  console.log(`Initial state:`)
  console.log(`  ${initialState.detected}`)
  console.log(`  ${initialState.windowSize}`)
  console.log(`  ${initialState.containerSize}`)
  
  // Test by changing window size gradually
  const testSizes = [
    { width: 800, height: 600, name: 'Medium size' },
    { width: 1200, height: 800, name: 'Large size' },
    { width: 500, height: 400, name: 'Small size' }
  ]
  
  for (const size of testSizes) {
    console.log(`\n--- Changing to ${size.name} (${size.width}x${size.height}) ---`)
    
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.waitForTimeout(1000) // Wait for resize animation to complete
    
    const currentState = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p'))
      const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
      const windowSizeP = paragraphs.find(p => p.textContent?.includes('Window Size:'))
      const containerSizeP = paragraphs.find(p => p.textContent?.includes('Container Size:'))
      return {
        detected: detectedP?.textContent || 'Not found',
        windowSize: windowSizeP?.textContent || 'Not found',
        containerSize: containerSizeP?.textContent || 'Not found'
      }
    })
    
    console.log(`  ${currentState.detected}`)
    console.log(`  ${currentState.windowSize}`)
    console.log(`  ${currentState.containerSize}`)
    
    // Basic operation verification
    expect(currentState.detected).toContain('Detected:')
    expect(currentState.windowSize).toContain(`${size.width} x ${size.height}`)
    expect(currentState.containerSize).toContain('Container Size:')
  }
  
  // Return to original size and verify
  console.log('\n--- Returning to original size (1280x720) ---')
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForTimeout(1000)
  
  const finalState = await page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll('p'))
    const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
    const windowSizeP = paragraphs.find(p => p.textContent?.includes('Window Size:'))
    const containerSizeP = paragraphs.find(p => p.textContent?.includes('Container Size:'))
    return {
      detected: detectedP?.textContent || 'Not found',
      windowSize: windowSizeP?.textContent || 'Not found',
      containerSize: containerSizeP?.textContent || 'Not found'
    }
  })
  
  console.log(`Final state:`)
  console.log(`  ${finalState.detected}`)
  console.log(`  ${finalState.windowSize}`)
  console.log(`  ${finalState.containerSize}`)
  
  // Basic operation verification
  expect(finalState.detected).toContain('Detected:')
  expect(finalState.windowSize).toContain('1280 x 720')
  expect(finalState.containerSize).toContain('Container Size:')
  
  console.log('\n✅ Final resize detection functionality test completed successfully')
}) 