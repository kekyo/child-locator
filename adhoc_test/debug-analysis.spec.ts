import { test, expect } from '@playwright/test'

test('useLocator continuous log output problem detailed analysis', async ({ page }) => {
  // Log counter
  let logCount = 0
  let logs: Array<{ time: number; message: string; caller: string }> = []
  
  // Monitor console logs in detail
  page.on('console', (msg) => {
    if (msg.text().includes('Detected component:')) {
      logCount++
      const now = Date.now()
      
      // Try to get stack trace
      const location = msg.location()
      
      logs.push({
        time: now,
        message: msg.text(),
        caller: `${location.url}:${location.lineNumber}:${location.columnNumber}`
      })
    }
  })
  
  await page.goto('http://localhost:59517')
  
  // Wait 5 seconds and collect logs
  await page.waitForTimeout(5000)
  
  console.log(`\n=== Detailed Log Analysis Results ===`)
  console.log(`Total log count: ${logCount}`)
  
  if (logs.length > 0) {
    // Details of first 10 logs
    console.log(`\n--- First 10 Logs Details ---`)
    logs.slice(0, 10).forEach((log, index) => {
      console.log(`${index + 1}. Time: ${log.time}, Source: ${log.caller}`)
    })
    
    // Log interval analysis
    console.log(`\n--- Log Interval Analysis ---`)
    const intervals: number[] = []
    for (let i = 1; i < Math.min(logs.length, 100); i++) {
      intervals.push(logs[i].time - logs[i-1].time)
    }
    
    if (intervals.length > 0) {
      const minInterval = Math.min(...intervals)
      const maxInterval = Math.max(...intervals)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      
      console.log(`Minimum interval: ${minInterval}ms`)
      console.log(`Maximum interval: ${maxInterval}ms`)
      console.log(`Average interval: ${avgInterval.toFixed(2)}ms`)
      
      // Count particularly short intervals (less than 1ms)
      const veryShortIntervals = intervals.filter(i => i < 1).length
      console.log(`Intervals less than 1ms: ${veryShortIntervals} items`)
    }
    
    // Duplicate logs at same time
    const timeGroups = new Map<number, number>()
    logs.forEach(log => {
      const count = timeGroups.get(log.time) || 0
      timeGroups.set(log.time, count + 1)
    })
    
    const duplicatedTimes = Array.from(timeGroups.entries()).filter(([_, count]) => count > 1)
    console.log(`\n--- Duplicate Logs at Same Time ---`)
    console.log(`Number of duplicate times: ${duplicatedTimes.length}`)
    if (duplicatedTimes.length > 0) {
      duplicatedTimes.slice(0, 5).forEach(([time, count]) => {
        console.log(`Time ${time}: ${count} items`)
      })
    }
  }
  
  // Test failure if logs are generated in large quantities
  expect(logCount).toBeLessThan(50) // Expect less than 50 items in 5 seconds
}) 