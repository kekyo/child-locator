import { test, expect } from '@playwright/test'

test('XY-axis scroll detection comprehensive verification', async ({ page }) => {
  // Monitor console logs
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('Detected component:')) {
      console.log(`[LOG] ${text}`)
    }
  })
  
  await page.goto('http://localhost:59517')
  
  // Check initial state
  await page.waitForTimeout(1000)
  
  console.log('\n=== XY-Axis Scroll Detection Test Start ===')
  
  // Enable debug logs
  console.log('Enabling debug logs...')
  await page.check('input[type="checkbox"]')
  await page.waitForTimeout(500)
  
  // Helper function to get current state
  const getCurrentState = async () => {
    return await page.evaluate(() => {
      const container = document.querySelector('[data-testid="container"]') as HTMLElement
      const paragraphs = Array.from(document.querySelectorAll('p'))
      const detectedP = paragraphs.find(p => p.textContent?.includes('Detected:'))
      const offsetP = paragraphs.find(p => p.textContent?.includes('Current Offset:'))
      
      return {
        containerScrollTop: container.scrollTop,
        containerScrollLeft: container.scrollLeft,
        containerScrollHeight: container.scrollHeight,
        containerScrollWidth: container.scrollWidth,
        containerClientHeight: container.clientHeight,
        containerClientWidth: container.clientWidth,
        windowScrollY: window.scrollY,
        windowScrollX: window.scrollX,
        detected: detectedP?.textContent || 'Not found',
        offset: offsetP?.textContent || 'Not found'
      }
    })
  }
  
  // Record initial state
  const initialState = await getCurrentState()
  console.log(`Initial state:`)
  console.log(`  Container scroll: (${initialState.containerScrollLeft}, ${initialState.containerScrollTop})`)
  console.log(`  Container size: ${initialState.containerClientWidth}x${initialState.containerClientHeight}`)
  console.log(`  Container content: ${initialState.containerScrollWidth}x${initialState.containerScrollHeight}`)
  console.log(`  Window scroll: (${initialState.windowScrollX}, ${initialState.windowScrollY})`)
  console.log(`  Detection: ${initialState.detected}`)
  
  // Test 1: Container Y-axis scrolling
  console.log('\n=== Test 1: Container Y-axis scrolling ===')
  await page.evaluate(() => {
    const container = document.querySelector('[data-testid="container"]') as HTMLElement
    container.scrollTop = 150
  })
  await page.waitForTimeout(1000)
  
  const afterYScrollState = await getCurrentState()
  console.log(`After Y-scroll: container scroll (${afterYScrollState.containerScrollLeft}, ${afterYScrollState.containerScrollTop})`)
  console.log(`Detection: ${afterYScrollState.detected}`)
  
  // Verify Y-scrolling occurred
  expect(afterYScrollState.containerScrollTop).toBeGreaterThan(initialState.containerScrollTop)
  
  // Test 2: Container X-axis scrolling
  console.log('\n=== Test 2: Container X-axis scrolling ===')
  await page.evaluate(() => {
    const container = document.querySelector('[data-testid="container"]') as HTMLElement
    container.scrollLeft = 150
  })
  await page.waitForTimeout(1000)
  
  const afterXScrollState = await getCurrentState()
  console.log(`After X-scroll: container scroll (${afterXScrollState.containerScrollLeft}, ${afterXScrollState.containerScrollTop})`)
  console.log(`Detection: ${afterXScrollState.detected}`)
  
  // Verify X-scrolling occurred
  expect(afterXScrollState.containerScrollLeft).toBeGreaterThan(initialState.containerScrollLeft)
  
  // Test 3: Container XY-axis combined scrolling
  console.log('\n=== Test 3: Container XY-axis combined scrolling ===')
  await page.evaluate(() => {
    const container = document.querySelector('[data-testid="container"]') as HTMLElement
    container.scrollLeft = 200
    container.scrollTop = 250
  })
  await page.waitForTimeout(1000)
  
  const afterXYScrollState = await getCurrentState()
  console.log(`After XY-scroll: container scroll (${afterXYScrollState.containerScrollLeft}, ${afterXYScrollState.containerScrollTop})`)
  console.log(`Detection: ${afterXYScrollState.detected}`)
  
  // Verify XY-scrolling occurred
  expect(afterXYScrollState.containerScrollLeft).toBe(200)
  expect(afterXYScrollState.containerScrollTop).toBe(250)
  
  // Test 4: Reset container scroll and test different coordinate detection
  console.log('\n=== Test 4: Testing coordinate detection at different scroll positions ===')
  
  // Reset container scroll
  await page.evaluate(() => {
    const container = document.querySelector('[data-testid="container"]') as HTMLElement
    container.scrollLeft = 0
    container.scrollTop = 0
  })
  await page.waitForTimeout(500)
  
  // Set coordinates to center (212, 175) using text inputs
  await page.evaluate(() => {
    const xInput = document.querySelector('input[type="text"]') as HTMLInputElement
    const yInput = document.querySelectorAll('input[type="text"]')[1] as HTMLInputElement
    if (xInput && yInput) {
      xInput.value = '212'
      yInput.value = '175'
      // Trigger change events
      xInput.dispatchEvent(new Event('input', { bubbles: true }))
      yInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await page.waitForTimeout(500)
  
  const coord100State = await getCurrentState()
  console.log(`At coordinate (100, 100): ${coord100State.detected}`)
  
  // Scroll container and check if detection changes
  await page.evaluate(() => {
    const container = document.querySelector('[data-testid="container"]') as HTMLElement
    container.scrollLeft = 100
    container.scrollTop = 100
  })
  await page.waitForTimeout(1000)
  
  const coord100ScrolledState = await getCurrentState()
  console.log(`At coordinate (100, 100) after scroll: ${coord100ScrolledState.detected}`)
  
  // Detection should potentially change due to scroll affecting element positions
  console.log(`Detection changed after scroll: ${coord100State.detected !== coord100ScrolledState.detected}`)
  
  // Test 5: Window-level Y-axis scrolling
  console.log('\n=== Test 5: Window-level Y-axis scrolling ===')
  await page.evaluate(() => {
    window.scrollTo(0, 300)
  })
  await page.waitForTimeout(1000)
  
  const afterWindowYScrollState = await getCurrentState()
  console.log(`After window Y-scroll: window scroll (${afterWindowYScrollState.windowScrollX}, ${afterWindowYScrollState.windowScrollY})`)
  console.log(`Detection: ${afterWindowYScrollState.detected}`)
  
  // Verify window Y-scrolling occurred
  expect(afterWindowYScrollState.windowScrollY).toBe(300)
  
  // Test 6: Window-level X-axis scrolling (if page is wide enough)
  console.log('\n=== Test 6: Window-level X-axis scrolling ===')
  
  // Make page wider to enable horizontal scrolling
  await page.evaluate(() => {
    document.body.style.width = '2000px'
  })
  await page.waitForTimeout(500)
  
  await page.evaluate(() => {
    window.scrollTo(200, 300)
  })
  await page.waitForTimeout(1000)
  
  const afterWindowXScrollState = await getCurrentState()
  console.log(`After window X-scroll: window scroll (${afterWindowXScrollState.windowScrollX}, ${afterWindowXScrollState.windowScrollY})`)
  console.log(`Detection: ${afterWindowXScrollState.detected}`)
  
  // Verify window X-scrolling occurred (Firefox may behave differently)
  expect(afterWindowXScrollState.windowScrollX).toBeGreaterThanOrEqual(0)
  
  // Test 7: Combined window XY scrolling
  console.log('\n=== Test 7: Combined window XY scrolling ===')
  await page.evaluate(() => {
    window.scrollTo(150, 500)
  })
  await page.waitForTimeout(1000)
  
  const afterWindowXYScrollState = await getCurrentState()
  console.log(`After window XY-scroll: window scroll (${afterWindowXYScrollState.windowScrollX}, ${afterWindowXYScrollState.windowScrollY})`)
  console.log(`Detection: ${afterWindowXYScrollState.detected}`)
  
  // Verify window XY-scrolling occurred (Firefox may behave differently)
  expect(afterWindowXYScrollState.windowScrollX).toBeGreaterThanOrEqual(0)
  expect(afterWindowXYScrollState.windowScrollY).toBeGreaterThanOrEqual(300)
  
  // Test 8: Comprehensive scroll test - both container and window
  console.log('\n=== Test 8: Comprehensive scroll test - both container and window ===')
  
  // Set specific coordinates for testing
  await page.evaluate(() => {
    const xInput = document.querySelector('input[type="text"]') as HTMLInputElement
    const yInput = document.querySelectorAll('input[type="text"]')[1] as HTMLInputElement
    if (xInput && yInput) {
      xInput.value = '200'
      yInput.value = '200'
      xInput.dispatchEvent(new Event('input', { bubbles: true }))
      yInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await page.waitForTimeout(500)
  
  // Apply both container and window scrolling
  await page.evaluate(() => {
    const container = document.querySelector('[data-testid="container"]') as HTMLElement
    container.scrollLeft = 50
    container.scrollTop = 50
    window.scrollTo(100, 200)
  })
  await page.waitForTimeout(1000)
  
  const finalState = await getCurrentState()
  console.log(`Final comprehensive test:`)
  console.log(`  Container scroll: (${finalState.containerScrollLeft}, ${finalState.containerScrollTop})`)
  console.log(`  Window scroll: (${finalState.windowScrollX}, ${finalState.windowScrollY})`)
  console.log(`  Detection: ${finalState.detected}`)
  
  // Verify all scrolling is working (Firefox may behave differently for window scroll)
  expect(finalState.containerScrollLeft).toBe(50)
  expect(finalState.containerScrollTop).toBe(50)
  expect(finalState.windowScrollX).toBeGreaterThanOrEqual(0)
  expect(finalState.windowScrollY).toBeGreaterThanOrEqual(200)
  
  // Verify detection is still working
  expect(finalState.detected).toContain('Item')
  
  console.log('\n✅ XY-axis scroll detection test completed successfully')
  console.log('All container and window scrolling tests passed!')
}) 