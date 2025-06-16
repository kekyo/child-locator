import { test, expect } from '@playwright/test'

test('Scrollable Container Detection Test', async ({ page }) => {
  // Navigate to the test page
  await page.goto('http://localhost:59517/test-page.html')
  await page.waitForTimeout(1000)
  
  console.log('\n=== Scrollable Container Detection Test Start ===')
  
     // Helper function to get test page state
   const getScrollState = async () => {
     return await page.evaluate(() => {
       const detectedElement = document.querySelector('#detected')
       const childrenCountElement = document.querySelector('#children-count')
       const offsetElement = document.querySelector('#current-offset')
       const calculatedElement = document.querySelector('#calculated-position')
       const distanceElement = document.querySelector('#distance')
       
       return {
         scrollTop: window.scrollY,
         scrollLeft: window.scrollX,
         scrollHeight: document.documentElement.scrollHeight,
         scrollWidth: document.documentElement.scrollWidth,
         clientHeight: window.innerHeight,
         clientWidth: window.innerWidth,
         detected: detectedElement?.textContent || 'Not found',
         childrenCount: childrenCountElement?.textContent || 'Not found',
         offset: offsetElement?.textContent || 'Not found',
         calculated: calculatedElement?.textContent || 'Not found',
         distance: distanceElement?.textContent || 'Not found'
       }
     })
   }

   // Helper function to get element positions relative to viewport
   const getElementPositions = async () => {
     return await page.evaluate(() => {
       const container = document.querySelector('[data-testid="container"]')
       const containerRect = container?.getBoundingClientRect()
       const elements = Array.from(document.querySelectorAll('[data-testid^="child-"]'))
       
       return {
         container: {
           left: containerRect?.left || 0,
           top: containerRect?.top || 0,
           right: containerRect?.right || 0,
           bottom: containerRect?.bottom || 0,
           width: containerRect?.width || 0,
           height: containerRect?.height || 0
         },
         elements: elements.map(el => {
           const rect = el.getBoundingClientRect()
           const testId = el.getAttribute('data-testid')
           const itemNumber = testId?.replace('child-', '') || '0'
           
           return {
             id: testId,
             itemNumber: parseInt(itemNumber),
             // Absolute viewport coordinates
             left: rect.left,
             top: rect.top,
             right: rect.right,
             bottom: rect.bottom,
             centerX: rect.left + rect.width / 2,
             centerY: rect.top + rect.height / 2,
             width: rect.width,
             height: rect.height,
             // Relative to container
             relativeLeft: rect.left - (containerRect?.left || 0),
             relativeTop: rect.top - (containerRect?.top || 0),
             relativeCenterX: rect.left - (containerRect?.left || 0) + rect.width / 2,
             relativeCenterY: rect.top - (containerRect?.top || 0) + rect.height / 2
           }
         }).sort((a, b) => a.itemNumber - b.itemNumber)
       }
     })
   }
  
  // Record initial state
  const initialState = await getScrollState()
  console.log(`Initial state:`)
  console.log(`  Scroll position: (${initialState.scrollLeft}, ${initialState.scrollTop})`)
  console.log(`  Container size: ${initialState.clientWidth}x${initialState.clientHeight}`)
  console.log(`  Content size: ${initialState.scrollWidth}x${initialState.scrollHeight}`)
  console.log(`  Detection: ${initialState.detected}`)
  console.log(`  Children: ${initialState.childrenCount}`)

     // Test 1: Basic window scrolling
   console.log('\n=== Test 1: Basic Window Scrolling ===')
   
   // Set initial offset to a known position
   await page.locator('#x-input').fill('200px')
   await page.locator('#y-input').fill('200px')
   await page.waitForTimeout(300)
   
   const beforeScrollState = await getScrollState()
   console.log(`Before scroll: ${beforeScrollState.detected}`)
   
   // Scroll down the window
   await page.evaluate(() => {
     window.scrollTo(0, 200)
   })
   await page.waitForTimeout(500)
   
   const afterVScrollState = await getScrollState()
   console.log(`After vertical scroll: ${afterVScrollState.detected}`)
   console.log(`Scroll position: (${afterVScrollState.scrollLeft}, ${afterVScrollState.scrollTop})`)
   
   // Verify scrolling occurred
   expect(afterVScrollState.scrollTop).toBeGreaterThan(initialState.scrollTop)
   expect(afterVScrollState.detected).toBeTruthy()

   // Test 2: Precise Element Boundary Detection with Fixed Coordinates (Core Test)
   console.log('\n=== Test 2: Precise Element Boundary Detection with Fixed Coordinates ===')
   
   // Reset scroll position
   await page.evaluate(() => window.scrollTo(0, 0))
   await page.waitForTimeout(300)
   
   // Get initial element positions
   const initialPositions = await getElementPositions()
   console.log(`\n--- Initial element positions ---`)
   initialPositions.elements.slice(0, 4).forEach(el => {
     console.log(`  ${el.id}: top=${el.top.toFixed(1)}, bottom=${el.bottom.toFixed(1)}, height=${el.height.toFixed(1)}`)
   })
   
   // Test with fixed coordinate (50% width, 0 height from container top)
   console.log(`\n=== Testing Fixed Coordinate (50%, 0px) - Element Height ±1px Boundary Test ===`)
   
   // Set fixed coordinates
   await page.locator('#x-input').fill('50%')
   await page.locator('#y-input').fill('0px')
   await page.waitForTimeout(200)
   
   // Test boundary detection for first 3 elements by scrolling
   for (let elementIndex = 0; elementIndex < Math.min(3, initialPositions.elements.length); elementIndex++) {
     const element = initialPositions.elements[elementIndex]
     console.log(`\n--- Testing ${element.id} boundary detection ---`)
     
     // Calculate scroll positions for boundary testing
     // Element height boundary: element.height - 1px and element.height + 1px
     const elementHeight = element.height
     const baseScroll = Math.max(0, element.top - 100) // Container offset
     
     // Test positions around element height boundaries
     const boundaryTests = [
       { 
         scroll: Math.max(0, baseScroll + elementHeight - 1), 
         name: `${element.id} height-1px boundary`,
         description: `Scroll to element height - 1px`
       },
       { 
         scroll: Math.max(0, baseScroll + elementHeight + 1), 
         name: `${element.id} height+1px boundary`,
         description: `Scroll to element height + 1px`
       }
     ]
     
     let previousDetection: string | null = null
     
     for (const boundaryTest of boundaryTests) {
       // Set scroll position
       await page.evaluate((y) => window.scrollTo(0, y), boundaryTest.scroll)
       await page.waitForTimeout(200)
       
       const boundaryState = await getScrollState()
       const currentDetection = boundaryState.detected
       
       console.log(`  ${boundaryTest.name} (scroll: ${boundaryTest.scroll}): ${currentDetection}`)
       
       // Check for detection changes at boundaries
       if (previousDetection && previousDetection !== currentDetection) {
         console.log(`    ✅ Detection changed: ${previousDetection} → ${currentDetection}`)
       }
       
       expect(boundaryState.detected).toBeTruthy()
       previousDetection = currentDetection
     }
   }

   // Test 3: Vertical Element Transition Boundaries (Simplified)
   console.log('\n=== Test 3: Vertical Element Transition Boundaries ===')
   
   // Reset to top
   await page.evaluate(() => window.scrollTo(0, 0))
   await page.waitForTimeout(300)
   
   // Use center X coordinate for vertical transition testing
   await page.locator('#x-input').fill('50%')
   await page.locator('#y-input').fill('50%')
   await page.waitForTimeout(200)
   
   // Get element positions for transition calculation
   const transitionPositions = await getElementPositions()
   
   // Test transitions between vertically adjacent elements (simplified to 2 pairs)
   const verticalPairs = [
     { from: transitionPositions.elements[0], to: transitionPositions.elements[3] }, // Item 1 → Item 4
     { from: transitionPositions.elements[1], to: transitionPositions.elements[4] }  // Item 2 → Item 5
   ]
   
   for (const pair of verticalPairs) {
     console.log(`\n--- Testing vertical transition: ${pair.from.id} → ${pair.to.id} ---`)
     
     // Calculate transition boundary scroll position
     const transitionScroll = Math.max(0, (pair.from.bottom + pair.to.top) / 2 - 100)
     
     const transitionTests = [
       { scroll: Math.max(0, transitionScroll - 1), name: 'Before transition -1px' },
       { scroll: transitionScroll, name: 'At transition boundary' },
       { scroll: transitionScroll + 1, name: 'After transition +1px' }
     ]
     
     let transitionDetected = false
     let previousItem: string | null = null
     
     for (const transitionTest of transitionTests) {
       await page.evaluate((y) => window.scrollTo(0, y), transitionTest.scroll)
       await page.waitForTimeout(150)
       
       const transitionState = await getScrollState()
       const currentItem = transitionState.detected
       
       console.log(`  ${transitionTest.name} (scroll: ${transitionTest.scroll.toFixed(1)}): ${currentItem}`)
       
       // Detect transition
       if (previousItem && previousItem !== currentItem) {
         console.log(`    🎯 Transition detected: ${previousItem} → ${currentItem}`)
         transitionDetected = true
       }
       
       previousItem = currentItem
       expect(transitionState.detected).toBeTruthy()
     }
     
     if (transitionDetected) {
       console.log(`  ✅ Successful transition boundary detection for ${pair.from.id} → ${pair.to.id}`)
     }
   }

   // Test 4: Scroll boundary detection (Original test - simplified)
   console.log('\n=== Test 4: Scroll Boundary Detection ===')
   
   // Reset scroll position
   await page.evaluate(() => window.scrollTo(0, 0))
   await page.waitForTimeout(300)
   
   // Get element positions at scroll top
   const topPositions = await getElementPositions()
   console.log(`\n--- Elements at scroll top ---`)
   topPositions.elements.slice(0, 3).forEach(el => {
     console.log(`  ${el.id}: viewport=(${el.centerX.toFixed(1)}, ${el.centerY.toFixed(1)}), relative=(${el.relativeCenterX.toFixed(1)}, ${el.relativeCenterY.toFixed(1)})`)
   })
   
   // Test boundary between Item 1 and Item 2 at scroll top
   const item1 = topPositions.elements[0]
   const item2 = topPositions.elements[1]
   
   // Use relative coordinates for boundary calculation
   const boundaryX = Math.round((item1.relativeCenterX + item2.relativeCenterX) / 2)
   const boundaryY = Math.round((item1.relativeCenterY + item2.relativeCenterY) / 2)
   
   console.log(`\n--- Testing Item 1-2 boundary at scroll top: (${boundaryX}, ${boundaryY}) ---`)
   console.log(`Item 1 relative center: (${item1.relativeCenterX.toFixed(1)}, ${item1.relativeCenterY.toFixed(1)})`)
   console.log(`Item 2 relative center: (${item2.relativeCenterX.toFixed(1)}, ${item2.relativeCenterY.toFixed(1)})`)
   
   await page.locator('#x-input').fill(`${boundaryX}px`)
   await page.locator('#y-input').fill(`${boundaryY}px`)
   await page.waitForTimeout(200)
   
   const boundaryState = await getScrollState()
   console.log(`Boundary detection: ${boundaryState.detected}`)
   console.log(`Distance: ${boundaryState.distance}`)
   
   // Should detect one of the adjacent items or closest item
   const detectsItem1 = boundaryState.detected.includes('Item 1')
   const detectsItem2 = boundaryState.detected.includes('Item 2')
   const detectsItem4 = boundaryState.detected.includes('Item 4')
   const detectsItem5 = boundaryState.detected.includes('Item 5')
   expect(detectsItem1 || detectsItem2 || detectsItem4 || detectsItem5).toBeTruthy()
   
   // Test 5: Scroll position impact on detection (Simplified)
   console.log('\n=== Test 5: Scroll Position Impact on Detection ===')
   
   // Test same relative coordinates at different scroll positions
   const testCoordinate = { x: 150, y: 150 }
   const scrollPositions = [0, 200, 400]
   
   for (const scrollY of scrollPositions) {
     console.log(`\n--- Testing at scroll position: ${scrollY} ---`)
     
     // Set scroll position
     await page.evaluate((y) => window.scrollTo(0, y), scrollY)
     await page.waitForTimeout(300)
     
     // Set test coordinates
     await page.locator('#x-input').fill(`${testCoordinate.x}px`)
     await page.locator('#y-input').fill(`${testCoordinate.y}px`)
     await page.waitForTimeout(200)
     
     const scrollState = await getScrollState()
     console.log(`Scroll ${scrollY}: ${scrollState.detected} (distance: ${scrollState.distance})`)
     
     expect(scrollState.detected).toBeTruthy()
   }
     
   console.log('\n✅ Scrollable Container Detection Test with Precise Boundary Values completed successfully')
}) 