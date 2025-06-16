import { test, expect } from '@playwright/test'

test('Window Resize Detection Test', async ({ page }) => {
  // Navigate to the test page
  await page.goto('http://localhost:59517/test-page.html')
  await page.waitForTimeout(1000)
  
  console.log('\n=== Window Resize Detection Test Start ===')
  
     // Helper function to get current state
   const getCurrentState = async () => {
     return await page.evaluate(() => {
       const detectedElement = document.querySelector('#detected')
       const childrenCountElement = document.querySelector('#children-count')
       
       return {
         detected: detectedElement?.textContent || 'Not found',
         childrenCount: childrenCountElement?.textContent || 'Not found',
         windowWidth: window.innerWidth,
         windowHeight: window.innerHeight,
         documentWidth: document.documentElement.clientWidth,
         documentHeight: document.documentElement.clientHeight
       }
     })
   }
  
  // Check initial state
  const initialState = await getCurrentState()
  console.log(`Initial state:`)
  console.log(`  Window size: ${initialState.windowWidth} x ${initialState.windowHeight}`)
  console.log(`  Document size: ${initialState.documentWidth} x ${initialState.documentHeight}`)
  console.log(`  Detection: ${initialState.detected}`)
  console.log(`  Children: ${initialState.childrenCount}`)

  // Test 1: Basic window resize
  console.log('\n=== Test 1: Basic window resize ===')
  await page.setViewportSize({ width: 800, height: 600 })
  await page.waitForTimeout(1000) // Allow time for resize observers to fire
  
  const afterResize1State = await getCurrentState()
  console.log(`After resize to 800x600:`)
  console.log(`  Window size: ${afterResize1State.windowWidth} x ${afterResize1State.windowHeight}`)
  console.log(`  Detection: ${afterResize1State.detected}`)
  
  // Verify resize occurred
  expect(afterResize1State.windowWidth).toBe(800)
  expect(afterResize1State.windowHeight).toBe(600)
  expect(afterResize1State.detected).toBeTruthy()

  // Test 2: Larger window size
  console.log('\n=== Test 2: Larger window size ===')
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.waitForTimeout(1000)
  
  const afterResize2State = await getCurrentState()
  console.log(`After resize to 1200x900:`)
  console.log(`  Window size: ${afterResize2State.windowWidth} x ${afterResize2State.windowHeight}`)
  console.log(`  Detection: ${afterResize2State.detected}`)
  
  // Verify resize occurred
  expect(afterResize2State.windowWidth).toBe(1200)
  expect(afterResize2State.windowHeight).toBe(900)
  expect(afterResize2State.detected).toBeTruthy()

  // Test 3: Test with different offset positions after resize
  console.log('\n=== Test 3: Different offset positions after resize ===')
  
  const testOffsets = [
    { x: 50, y: 50, description: 'Top-left corner' },
    { x: 100, y: 200, description: 'Center area' },
    { x: 150, y: 100, description: 'Right area' }
  ]
  
  for (const offsetTest of testOffsets) {
    console.log(`\n--- Testing ${offsetTest.description}: (${offsetTest.x}, ${offsetTest.y}) ---`)
    
         // Set offset in test page
     await page.locator('#x-input').fill(offsetTest.x.toString() + 'px')
     await page.locator('#y-input').fill(offsetTest.y.toString() + 'px')
    await page.waitForTimeout(500)
    
         const state = await getCurrentState()
     console.log(`  Detection: ${state.detected}`)
    
    expect(state.detected).toBeTruthy()
  }

  // Test 4: Multiple rapid resize changes
  console.log('\n=== Test 4: Multiple rapid resize changes ===')
  
  const resizeSizes = [
    { width: 800, height: 600 },
    { width: 1000, height: 700 },
    { width: 1100, height: 800 },
    { width: 900, height: 650 },
    { width: 1200, height: 900 }
  ]
  
  for (const size of resizeSizes) {
    await page.setViewportSize(size)
    await page.waitForTimeout(300) // Shorter wait for rapid changes
    
    const state = await getCurrentState()
    console.log(`Size ${size.width}x${size.height}: ${state.detected}`)
    
    expect(state.windowWidth).toBe(size.width)
    expect(state.windowHeight).toBe(size.height)
    expect(state.detected).toBeTruthy()
  }

  // Test 5: Extreme size changes
  console.log('\n=== Test 5: Extreme size changes ===')
  
  // Very small size
  await page.setViewportSize({ width: 400, height: 300 })
  await page.waitForTimeout(1000)
  
  const smallState = await getCurrentState()
  console.log(`Small size (400x300): ${smallState.detected}`)
  expect(smallState.windowWidth).toBe(400)
  expect(smallState.detected).toBeTruthy()
  
  // Very large size
  await page.setViewportSize({ width: 1600, height: 1200 })
  await page.waitForTimeout(1000)
  
  const largeState = await getCurrentState()
  console.log(`Large size (1600x1200): ${largeState.detected}`)
  expect(largeState.windowWidth).toBe(1600)
  expect(largeState.detected).toBeTruthy()

  // Test 6: Return to standard size and verify consistency
  console.log('\n=== Test 6: Return to standard size ===')
  
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForTimeout(1000)
  
  const finalState = await getCurrentState()
  console.log(`Final size (1280x720): ${finalState.detected}`)
  console.log(`Final children count: ${finalState.childrenCount}`)
  
  expect(finalState.windowWidth).toBe(1280)
  expect(finalState.windowHeight).toBe(720)
  expect(finalState.detected).toBeTruthy()
  
  console.log('\n✅ Window resize detection test completed successfully')
}) 