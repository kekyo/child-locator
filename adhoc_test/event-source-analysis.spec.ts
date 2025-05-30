import { test, expect } from '@playwright/test'

test('useLocator event source detailed analysis', async ({ page }) => {
  // Monitor debug logs
  const debugLogs: Array<{ 
    time: number; 
    message: string; 
    source?: string;
    counters?: string;
  }> = []
  
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('[DEBUG] detectComponent called')) {
      const sourceMatch = text.match(/from: (.+)/)
      const source = sourceMatch ? sourceMatch[1] : 'unknown'
      
      debugLogs.push({
        time: Date.now(),
        message: text,
        source
      })
    } else if (text.includes('[DEBUG] Counters')) {
      const countersMatch = text.match(/Counters - (.+)/)
      if (debugLogs.length > 0) {
        debugLogs[debugLogs.length - 1].counters = countersMatch ? countersMatch[1] : ''
      }
    }
  })
  
  await page.goto('http://localhost:59517')
  
  // Wait for initialization
  await page.waitForTimeout(1000)
  
  console.log(`\n=== Event Source Analysis Results ===`)
  console.log(`Total events: ${debugLogs.length}`)
  
  if (debugLogs.length > 0) {
    // Aggregate by source
    const sourceCount = new Map<string, number>()
    debugLogs.forEach(log => {
      const count = sourceCount.get(log.source!) || 0
      sourceCount.set(log.source!, count + 1)
    })
    
    console.log(`\n--- Event Source Aggregation ---`)
    Array.from(sourceCount.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`${source}: ${count} items`)
      })
    
    // Details of first 20 items
    console.log(`\n--- Details of First 20 Items ---`)
    debugLogs.slice(0, 20).forEach((log, index) => {
      const interval = index > 0 ? log.time - debugLogs[index - 1].time : 0
      console.log(`${index + 1}. [${interval}ms] ${log.source} - ${log.counters || ''}`)
    })
    
    // Detect consecutive same source patterns
    console.log(`\n--- Consecutive Pattern Analysis ---`)
    let maxConsecutive = 1
    let consecutiveSource = ''
    let currentConsecutive = 1
    
    for (let i = 1; i < debugLogs.length; i++) {
      if (debugLogs[i].source === debugLogs[i-1].source) {
        currentConsecutive++
      } else {
        if (currentConsecutive > maxConsecutive) {
          maxConsecutive = currentConsecutive
          consecutiveSource = debugLogs[i-1].source!
        }
        currentConsecutive = 1
      }
    }
    
    console.log(`Maximum consecutive count: ${maxConsecutive} (Source: ${consecutiveSource})`)
  }
  
  // Verify debug logs are not excessively output
  expect(debugLogs.length).toBeLessThan(100) // Expect less than 100 items in 1 second
}) 