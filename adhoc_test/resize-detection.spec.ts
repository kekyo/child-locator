import { test, expect } from '@playwright/test'

test('Window size change detection functionality verification', async ({ page }) => {
  // Capture console logs
  const logs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })
  
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('\n=== Window Size Change Detection Test Start ===')
  
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
  
  console.log(`Initial size - ${initialState.windowSize}, ${initialState.containerSize}`)
  
  // Change window size
  console.log('\n--- Changing window size ---')
  await page.setViewportSize({ width: 800, height: 600 })
  await page.waitForTimeout(500)
  
  // Enable debug logs
  await page.check('input[type="checkbox"]')
  await page.waitForTimeout(500)
  
  const initialLogCount = logs.length
  console.log(`Initial log count: ${initialLogCount}`)
  
  // Change size further to verify ResizeObserver operation
  console.log('\n--- Further size change to verify ResizeObserver operation ---')
  await page.setViewportSize({ width: 1000, height: 700 })
  await page.waitForTimeout(1000)
  
  const afterResizeLogCount = logs.length
  console.log(`After resize log count: ${afterResizeLogCount}`)
  console.log(`New log count: ${afterResizeLogCount - initialLogCount}`)
  
  // Check detection state
  const afterResizeState = await page.evaluate(() => {
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
  
  console.log(`After resize - ${afterResizeState.windowSize}, ${afterResizeState.containerSize}`)
  console.log(`Detection result: ${afterResizeState.detected}`)
  
  // Basic operation verification
  expect(afterResizeState.detected).toContain('Detected:')
  expect(afterResizeState.windowSize).toContain('1000 x 700')
  expect(afterResizeState.containerSize).toContain('Container Size:')
  
  // Return to original size
  console.log('\n--- Returning to original size ---')
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForTimeout(500)
  
  const finalState = await page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll('p'))
    const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
    const windowSizeP = paragraphs.find(p => p.textContent?.includes('Window Size:'))
    return {
      detected: detectedP?.textContent || 'Not found',
      windowSize: windowSizeP?.textContent || 'Not found'
    }
  })
  
  console.log(`Final size - ${finalState.windowSize}`)
  console.log(`Final detection: ${finalState.detected}`)
  
  // Verify final state
  expect(finalState.detected).toContain('Detected:')
  expect(finalState.windowSize).toContain('1280 x 720')
  
  console.log('\n✅ Window size change detection test completed successfully')
}) 