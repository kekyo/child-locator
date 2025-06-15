import { test, expect } from '@playwright/test'

// Window type extension
declare global {
  interface Window {
    boundaryTest: {
      setTargetPosition: (x: number, y: number) => void
      getDetectedElement: () => HTMLElement | null
      getCurrentCoordinates: () => { x: number; y: number }
      getDistance: () => number
      getChildrenCount: () => number
      getElementBounds: (selector: string) => DOMRect | null
    }
  }
}

test.describe('Child Locator - Boundary Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Load test page
    await page.goto('/boundary-test.html')
    await page.waitForLoadState('networkidle')
    
    // Wait for initialization
    await page.waitForFunction(() => window.boundaryTest !== undefined)
    await page.waitForTimeout(500)
  })

  test('should validate boundary detection for child elements 1-5', async ({ page }) => {
    console.log('=== Boundary Validation Test Start ===')
    
    // Get actual measurements of child elements
    const childElements = [
      { name: 'child-1', selector: '[data-testid="child-1"]' },
      { name: 'child-2', selector: '[data-testid="child-2"]' },
      { name: 'child-3', selector: '[data-testid="child-3"]' },
      { name: 'child-4', selector: '[data-testid="child-4"]' },
      { name: 'child-5', selector: '[data-testid="child-5"]' },
    ]
    
    const elementBounds: Array<{
      name: string
      bounds: { x: number; y: number; width: number; height: number }
      center: { x: number; y: number }
    }> = []
    
    // Get bounding box for each element
    for (const element of childElements) {
      const boundingBox = await page.locator(element.selector).boundingBox()
      if (boundingBox) {
        // Convert to scroll container coordinate system
        const scrollContainer = page.locator('[data-testid="scroll-container"]')
        const scrollContainerBox = await scrollContainer.boundingBox()
        
        if (scrollContainerBox) {
          const relativeX = boundingBox.x - scrollContainerBox.x
          const relativeY = boundingBox.y - scrollContainerBox.y
          
          elementBounds.push({
            name: element.name,
            bounds: {
              x: relativeX,
              y: relativeY,
              width: boundingBox.width,
              height: boundingBox.height
            },
            center: {
              x: relativeX + boundingBox.width / 2,
              y: relativeY + boundingBox.height / 2
            }
          })
        }
      }
    }
    
    console.log('Element measurements:')
    elementBounds.forEach(el => {
      console.log(`${el.name}: center=(${el.center.x.toFixed(0)}, ${el.center.y.toFixed(0)}), bounds=(${el.bounds.x.toFixed(0)}, ${el.bounds.y.toFixed(0)}, ${el.bounds.width}, ${el.bounds.height})`)
    })
    
    // Execute boundary value tests
    for (let i = 0; i < elementBounds.length - 1; i++) {
      const currentElement = elementBounds[i]
      const nextElement = elementBounds[i + 1]
      
      console.log(`\n--- Boundary test between ${currentElement.name} and ${nextElement.name} ---`)
      
      // Horizontal boundary test (between elements in same row)
      if (Math.abs(currentElement.center.y - nextElement.center.y) < 50) {
        const boundaryX = (currentElement.bounds.x + currentElement.bounds.width + nextElement.bounds.x) / 2
        const testY = currentElement.center.y
        
        console.log(`Horizontal boundary test: x=${boundaryX.toFixed(1)}, y=${testY.toFixed(1)}`)
        
        // 1px before boundary (current element should be detected)
        const beforeBoundaryX = Math.floor(boundaryX - 1)
        await page.evaluate(({ x, y }) => {
          window.boundaryTest.setTargetPosition(x, y)
        }, { x: beforeBoundaryX, y: testY })
        
        await page.waitForTimeout(100)
        
        const detectedBefore = await page.evaluate(() => {
          const element = window.boundaryTest.getDetectedElement()
          return element ? element.textContent : null
        })
        
        console.log(`Boundary-1px (${beforeBoundaryX}, ${testY.toFixed(1)}): ${detectedBefore}`)
        expect(detectedBefore).toBe(currentElement.name.replace('child-', 'Child Element '))
        
        // 1px after boundary (next element should be detected)
        const afterBoundaryX = Math.ceil(boundaryX + 1)
        await page.evaluate(({ x, y }) => {
          window.boundaryTest.setTargetPosition(x, y)
        }, { x: afterBoundaryX, y: testY })
        
        await page.waitForTimeout(100)
        
        const detectedAfter = await page.evaluate(() => {
          const element = window.boundaryTest.getDetectedElement()
          return element ? element.textContent : null
        })
        
        console.log(`Boundary+1px (${afterBoundaryX}, ${testY.toFixed(1)}): ${detectedAfter}`)
        expect(detectedAfter).toBe(nextElement.name.replace('child-', 'Child Element '))
      }
      
      // Vertical boundary test (between elements in different rows)
      if (Math.abs(currentElement.center.x - nextElement.center.x) < 50 && 
          Math.abs(currentElement.center.y - nextElement.center.y) > 50) {
        const boundaryY = (currentElement.bounds.y + currentElement.bounds.height + nextElement.bounds.y) / 2
        const testX = currentElement.center.x
        
        console.log(`Vertical boundary test: x=${testX.toFixed(1)}, y=${boundaryY.toFixed(1)}`)
        
        // 1px before boundary (current element should be detected)
        const beforeBoundaryY = Math.floor(boundaryY - 1)
        await page.evaluate(({ x, y }) => {
          window.boundaryTest.setTargetPosition(x, y)
        }, { x: testX, y: beforeBoundaryY })
        
        await page.waitForTimeout(100)
        
        const detectedBefore = await page.evaluate(() => {
          const element = window.boundaryTest.getDetectedElement()
          return element ? element.textContent : null
        })
        
        console.log(`Boundary-1px (${testX.toFixed(1)}, ${beforeBoundaryY}): ${detectedBefore}`)
        expect(detectedBefore).toBe(currentElement.name.replace('child-', 'Child Element '))
        
        // 1px after boundary (next element should be detected)
        const afterBoundaryY = Math.ceil(boundaryY + 1)
        await page.evaluate(({ x, y }) => {
          window.boundaryTest.setTargetPosition(x, y)
        }, { x: testX, y: afterBoundaryY })
        
        await page.waitForTimeout(100)
        
        const detectedAfter = await page.evaluate(() => {
          const element = window.boundaryTest.getDetectedElement()
          return element ? element.textContent : null
        })
        
        console.log(`Boundary+1px (${testX.toFixed(1)}, ${afterBoundaryY}): ${detectedAfter}`)
        expect(detectedAfter).toBe(nextElement.name.replace('child-', 'Child Element '))
      }
    }
  })

  test('should maintain detection consistency during scroll', async ({ page }) => {
    console.log('=== Scroll Consistency Test ===')
    
    // Initial detection
    await page.evaluate(() => {
      window.boundaryTest.setTargetPosition(120, 80)
    })
    await page.waitForTimeout(100)
    
    const initialDetected = await page.evaluate(() => {
      const element = window.boundaryTest.getDetectedElement()
      return element ? element.textContent : null
    })
    
    console.log(`Initial detection: ${initialDetected}`)
    
    // Execute scroll
    const scrollContainer = page.locator('[data-testid="scroll-container"]')
    await scrollContainer.evaluate(el => el.scrollTop = 100)
    await page.waitForTimeout(200)
    
    // Detection after scroll
    const scrolledDetected = await page.evaluate(() => {
      const element = window.boundaryTest.getDetectedElement()
      return element ? element.textContent : null
    })
    
    console.log(`Detection after scroll: ${scrolledDetected}`)
    
    // Reset scroll position
    await scrollContainer.evaluate(el => el.scrollTop = 0)
    await page.waitForTimeout(200)
    
    // Detection after reset
    const resetDetected = await page.evaluate(() => {
      const element = window.boundaryTest.getDetectedElement()
      return element ? element.textContent : null
    })
    
    console.log(`Detection after reset: ${resetDetected}`)
    
    // Verify same detection result as initial state
    expect(resetDetected).toBe(initialDetected)
  })

  test('should detect exact center positions of elements', async ({ page }) => {
    console.log('=== Center Position Detection Test ===')
    
    const childElements = [
      { name: 'child-1', selector: '[data-testid="child-1"]' },
      { name: 'child-2', selector: '[data-testid="child-2"]' },
      { name: 'child-3', selector: '[data-testid="child-3"]' },
      { name: 'child-4', selector: '[data-testid="child-4"]' },
      { name: 'child-5', selector: '[data-testid="child-5"]' },
    ]
    
    for (const element of childElements) {
      const boundingBox = await page.locator(element.selector).boundingBox()
      const scrollContainer = page.locator('[data-testid="scroll-container"]')
      const scrollContainerBox = await scrollContainer.boundingBox()
      
      if (boundingBox && scrollContainerBox) {
        const relativeX = boundingBox.x - scrollContainerBox.x
        const relativeY = boundingBox.y - scrollContainerBox.y
        const centerX = relativeX + boundingBox.width / 2
        const centerY = relativeY + boundingBox.height / 2
        
        console.log(`${element.name} center position test: (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`)
        
        // Center position detection test
        await page.evaluate(({ x, y }) => {
          window.boundaryTest.setTargetPosition(x, y)
        }, { x: centerX, y: centerY })
        
        await page.waitForTimeout(100)
        
        const detected = await page.evaluate(() => {
          const element = window.boundaryTest.getDetectedElement()
          return element ? element.textContent : null
        })
        
        const distance = await page.evaluate(() => window.boundaryTest.getDistance())
        
        console.log(`Detection result: ${detected}, distance: ${distance.toFixed(1)}px`)
        
        // Verify expected element is detected
        expect(detected).toBe(element.name.replace('child-', 'Child Element '))
        
        // Verify distance at center position is relatively small
        expect(distance).toBeLessThan(50)
      }
    }
  })
}) 