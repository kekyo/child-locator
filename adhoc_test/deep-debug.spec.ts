import { test, expect } from '@playwright/test'

test('useLocator deep debug analysis', async ({ page }) => {
  // Keep track of all events and information in detail
  const events: Array<{
    timestamp: number
    type: string
    source?: string
    data?: unknown
  }> = []
  
  // Hook console output
  page.on('console', (msg) => {
    events.push({
      timestamp: Date.now(),
      type: 'console',
      source: `${msg.type()}`,
      data: msg.text()
    })
  })
  
  // Monitor page errors
  page.on('pageerror', (error) => {
    events.push({
      timestamp: Date.now(),
      type: 'error',
      data: error.message
    })
  })
  
  await page.goto('http://localhost:59517')
  
  // Wait for page to stabilize
  await page.waitForTimeout(2000)
  
  // Collect detailed information
  const info = await page.evaluate(() => {
    return {
      userAgent: navigator.userAgent,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      children: {
        container1: document.querySelectorAll('#test-container-1 > *').length,
        container2: document.querySelectorAll('#test-container-2 > *').length
      },
      elements: {
        childA: !!document.querySelector('[data-testid="child-A"]'),
        childB: !!document.querySelector('[data-testid="child-B"]'),
        childC: !!document.querySelector('[data-testid="child-C"]'),
        childD: !!document.querySelector('[data-testid="child-D"]')
      }
    }
  })
  
  console.log('\n=== Deep Debug Information ===')
  console.log('Page Info:', JSON.stringify(info, null, 2))
  console.log(`Total events captured: ${events.length}`)
  
  // Event type distribution
  const eventTypes = events.reduce((acc: Record<string, number>, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {})
  console.log('Event distribution:', eventTypes)
  
  // Show first 20 events
  console.log('\n--- First 20 Events ---')
  events.slice(0, 20).forEach((event, index) => {
    console.log(`${index + 1}. ${event.type} (${event.source || 'N/A'}): ${JSON.stringify(event.data).substring(0, 100)}`)
  })
  
  // Monitor changes for 5 more seconds
  await page.waitForTimeout(5000)
  
  console.log(`Final event count: ${events.length}`)
  expect(events.length).toBeLessThan(200) // Avoid excessive events
}) 