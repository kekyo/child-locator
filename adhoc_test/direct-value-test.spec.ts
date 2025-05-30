import { test, expect } from '@playwright/test'

test('Direct value setting test', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Direct Value Setting Test ===')
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found'
    }
  })
  
  console.log(`Initial state: ${initialState.offset} - ${initialState.detected}`)
  
  // Set slider values directly with JavaScript
  console.log('\nSetting slider to (212, 175) directly with JavaScript...')
  await page.evaluate(() => {
    const sliderX = document.querySelector('input[type="range"]:first-of-type') as HTMLInputElement
    const sliderY = document.querySelector('input[type="range"]:last-of-type') as HTMLInputElement
    
    if (sliderX && sliderY) {
      sliderX.value = '212'
      sliderY.value = '175'
      
      // Fire change events
      sliderX.dispatchEvent(new Event('change', { bubbles: true }))
      sliderY.dispatchEvent(new Event('change', { bubbles: true }))
      
      console.log(`Slider setting completed: X=${sliderX.value}, Y=${sliderY.value}`)
    }
  })
  
  await page.waitForTimeout(500)
  
  const afterDirectSet = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    const sliderX = document.querySelector('input[type="range"]:first-of-type') as HTMLInputElement
    const sliderY = document.querySelector('input[type="range"]:last-of-type') as HTMLInputElement
    
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found',
      sliderXValue: sliderX?.value || 'Not found',
      sliderYValue: sliderY?.value || 'Not found'
    }
  })
  
  console.log(`After direct setting: ${afterDirectSet.offset} - ${afterDirectSet.detected}`)
  console.log(`Slider values: X=${afterDirectSet.sliderXValue}, Y=${afterDirectSet.sliderYValue}`)
  
  // Expect Item 5 to be detected
  expect(afterDirectSet.detected).toContain('Item 5')
  expect(afterDirectSet.offset).toContain('(212px, 175px)')
  
  console.log('\n✅ Direct value setting test completed successfully')
}) 