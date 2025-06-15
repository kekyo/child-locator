import { test } from '@playwright/test'

test('Button click coordinate setting debug', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Button Click Coordinate Setting Debug ===')
  
  // Click each preset button and check coordinates
  const presetButtons = [
    'Top Left', 'Top Center', 'Top Right',
    'Middle Left', 'Center', 'Middle Right',
    'Bottom Left', 'Bottom Center', 'Bottom Right',
    'Extra Item'
  ]
  
  for (const buttonName of presetButtons) {
    console.log(`\n--- ${buttonName} button test ---`)
    
    // State before button click
    const beforeState = await page.evaluate(() => {
      const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
      const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
      return {
        offset: offsetP?.textContent || 'Not found',
        detected: detectedP?.textContent || 'Not found'
      }
    })
    
    console.log(`  Before click: ${beforeState.offset}`)
    console.log(`  Before click: ${beforeState.detected}`)
    
    // Use JavaScript click to ensure it works
    await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const targetButton = buttons.find(b => b.textContent?.trim() === name)
      if (targetButton) {
        console.log(`Clicking button: ${name}`)
        targetButton.click()
      }
    }, buttonName)
    await page.waitForTimeout(500) // Wait a bit longer
    
    // State after button click
    const afterState = await page.evaluate(() => {
      const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
      const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
      const sliderX = (document.querySelector('input[type="range"]:first-of-type') as HTMLInputElement)?.value
      const sliderY = (document.querySelector('input[type="range"]:last-of-type') as HTMLInputElement)?.value
      return {
        offset: offsetP?.textContent || 'Not found',
        detected: detectedP?.textContent || 'Not found',
        sliderX: sliderX || 'Not found',
        sliderY: sliderY || 'Not found'
      }
    })
    
    console.log(`  After click: ${afterState.offset}`)
    console.log(`  After click: ${afterState.detected}`)
    console.log(`  Slider X: ${afterState.sliderX}`)
    console.log(`  Slider Y: ${afterState.sliderY}`)
    
    // Check button background color (whether it's selected)
    const buttonStyle = await page.evaluate((name) => {
      const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent === name)
      return button ? window.getComputedStyle(button).backgroundColor : 'Not found'
    }, buttonName)
    
    console.log(`  Button background color: ${buttonStyle}`)
  }
}) 