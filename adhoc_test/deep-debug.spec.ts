import { test, expect } from '@playwright/test'

test('useLocator infinite loop problem root cause analysis', async ({ page }) => {
  // Extract detailed information from console logs
  const logs: Array<{ 
    time: number; 
    type: string; 
    content: string;
    stackTrace?: string;
  }> = []
  
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('Detected component:') || 
        text.includes('Processing detection') || 
        text.includes('hasResultChanged')) {
      logs.push({
        time: Date.now(),
        type: msg.type(),
        content: text
      })
    }
  })
  
  // Inject debug code in JavaScript execution context
  await page.addInitScript(() => {
    let callCount = 0
    let originalConsoleLog = console.log
    
    window.addEventListener('DOMContentLoaded', () => {
      // Monitor onDetect callback calls
      const originalOnDetect = (window as any).onDetectCallback
      if (originalOnDetect) {
        (window as any).onDetectCallback = (...args: any[]) => {
          callCount++
          console.log(`[DEBUG] onDetect called #${callCount}`)
          if (callCount <= 10) {
            console.log(`[DEBUG] Arguments:`, args)
          }
          return originalOnDetect(...args)
        }
      }
    })
  })
  
  await page.goto('http://localhost:59517')
  
  // Monitor internal state of useLocator with JavaScript
  await page.evaluate(() => {
    // Monitor functions inside useLocator hook
    const original = (window as any).detectComponent
    if (original) {
      let detectCount = 0
      ;(window as any).detectComponent = function(...args: any[]) {
        detectCount++
        if (detectCount <= 100) { // Log output only for first 100 times
          console.log(`[DEBUG] detectComponent called #${detectCount}`)
        }
        return original.apply(this, args)
      }
    }
  })
  
  // Wait for 2 seconds
  await page.waitForTimeout(2000)
  
  // Analyze results
  console.log(`\n=== Infinite Loop Analysis Results ===`)
  console.log(`Total log count: ${logs.length}`)
  
  if (logs.length > 20) {
    console.log(`\n--- Pattern Analysis ---`)
    
    // Detect consecutive logs with same content
    let consecutiveCount = 1
    let maxConsecutive = 1
    let consecutiveContent = ''
    
    for (let i = 1; i < Math.min(logs.length, 1000); i++) {
      if (logs[i].content === logs[i-1].content) {
        consecutiveCount++
      } else {
        if (consecutiveCount > maxConsecutive) {
          maxConsecutive = consecutiveCount
          consecutiveContent = logs[i-1].content
        }
        consecutiveCount = 1
      }
    }
    
    console.log(`Maximum consecutive count: ${maxConsecutive}`)
    console.log(`Consecutive content: ${consecutiveContent.substring(0, 100)}...`)
    
    // Time interval analysis
    const intervals: number[] = []
    for (let i = 1; i < Math.min(logs.length, 100); i++) {
      intervals.push(logs[i].time - logs[i-1].time)
    }
    
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const zeroIntervals = intervals.filter(i => i === 0).length
      console.log(`Average interval: ${avgInterval.toFixed(2)}ms`)
      console.log(`0ms intervals: ${zeroIntervals} items`)
    }
  }
  
  // Test failure if problem occurs
  expect(logs.length).toBeLessThan(100) // Expect less than 100 items in 2 seconds
}) 