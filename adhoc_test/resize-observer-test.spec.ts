import { test, expect } from '@playwright/test'

test('ResizeObserver operation detailed verification', async ({ page }) => {
  // Capture console logs
  const allLogs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      allLogs.push(msg.text())
    }
  })
  
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('\n=== ResizeObserver Operation Verification Start ===')
  
  // Enable debug logs
  console.log('Debug logs enabled')
  await page.check('input[type="checkbox"]')
  await page.waitForTimeout(500)
  
  const initialLogCount = allLogs.length
  console.log(`Initial log count: ${initialLogCount}`)
  
  // Change window size to verify ResizeObserver operation
  console.log('\n--- Changing window size ---')
  await page.setViewportSize({ width: 900, height: 650 })
  await page.waitForTimeout(1000)
  
  const afterModeChangeLogCount = allLogs.length
  console.log(`Log count after size change: ${afterModeChangeLogCount}`)
  console.log(`New log count: ${afterModeChangeLogCount - initialLogCount}`)
  
  // Check detection state
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
  
  console.log(`Current state:`)
  console.log(`  ${currentState.detected}`)
  console.log(`  ${currentState.windowSize}`)
  console.log(`  ${currentState.containerSize}`)
  
  // Change size further
  console.log('\n--- Further size change ---')
  await page.setViewportSize({ width: 1100, height: 750 })
  await page.waitForTimeout(1000)
  
  const afterSecondChangeLogCount = allLogs.length
  console.log(`Log count after second change: ${afterSecondChangeLogCount}`)
  console.log(`Additional log count: ${afterSecondChangeLogCount - afterModeChangeLogCount}`)
  
  // Return to original size
  console.log('\n--- Return to original size ---')
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForTimeout(500)
  
  const finalLogCount = allLogs.length
  console.log(`Final log count: ${finalLogCount}`)
  
  // Check final state
  const finalState = await page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll('p'))
    const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
    const windowSizeP = paragraphs.find(p => p.textContent?.includes('Window Size:'))
    return {
      detected: detectedP?.textContent || 'Not found',
      windowSize: windowSizeP?.textContent || 'Not found'
    }
  })
  
  console.log(`Final state:`)
  console.log(`  ${finalState.detected}`)
  console.log(`  ${finalState.windowSize}`)
  
  // Analyze log content
  console.log('\nLog content:')
  const relevantLogs = allLogs.filter(log => 
    log.includes('Detected component:') || 
    log.includes('Offset changed:') ||
    log.includes('Window size:') ||
    log.includes('Container size:')
  )
  
  relevantLogs.slice(-10).forEach((log, index) => {
    console.log(`  ${index + 1}: ${log}`)
  })
  
  // Basic operation verification
  expect(finalState.detected).toContain('Detected:')
  expect(finalState.windowSize).toContain('1280 x 720')
  
  console.log('\n✅ ResizeObserver operation verification completed')
}) 