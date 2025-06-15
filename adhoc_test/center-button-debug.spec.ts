import { test } from '@playwright/test'

test('Center button detailed debug', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Center Button Detailed Debug ===')
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    const sliderX = (document.querySelector('input[type="range"]:first-of-type') as HTMLInputElement)
    const sliderY = (document.querySelector('input[type="range"]:last-of-type') as HTMLInputElement)
    
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found',
      sliderXValue: sliderX?.value || 'Not found',
      sliderYValue: sliderY?.value || 'Not found',
      sliderXMin: sliderX?.min || 'Not found',
      sliderXMax: sliderX?.max || 'Not found',
      sliderYMin: sliderY?.min || 'Not found',
      sliderYMax: sliderY?.max || 'Not found'
    }
  })
  
  console.log('Initial state:')
  console.log(`  ${initialState.offset}`)
  console.log(`  ${initialState.detected}`)
  console.log(`  Slider X: ${initialState.sliderXValue} (${initialState.sliderXMin}-${initialState.sliderXMax})`)
  console.log(`  Slider Y: ${initialState.sliderYValue} (${initialState.sliderYMin}-${initialState.sliderYMax})`)
  
  // Check Center button coordinates
  const centerButtonInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const centerButton = buttons.find(b => b.textContent === 'Center')
    
    if (!centerButton) return { found: false }
    
    const rect = centerButton.getBoundingClientRect()
    const style = window.getComputedStyle(centerButton)
    
    return {
      found: true,
      text: centerButton.textContent,
      backgroundColor: style.backgroundColor,
      position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
    }
  })
  
  if (centerButtonInfo.found && centerButtonInfo.position) {
    console.log('\nCenter button information:')
    console.log(`  Text: "${centerButtonInfo.text}"`)
    console.log(`  Background color: ${centerButtonInfo.backgroundColor}`)
    console.log(`  Position: (${centerButtonInfo.position.x}, ${centerButtonInfo.position.y})`)
    console.log(`  Size: ${centerButtonInfo.position.width} x ${centerButtonInfo.position.height}`)
  } else {
    console.log('\n❌ Center button not found')
  }
  
  // Capture console logs
  const logs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })
  
  // Click Center button
  console.log('\nClicking Center button...')
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const centerButton = buttons.find(b => b.textContent?.trim() === 'Center')
    if (centerButton) {
      console.log('Clicking Center button')
      centerButton.click()
    }
  })
  await page.waitForTimeout(1000)
  
  // Check state after clicking
  const afterClickState = await page.evaluate(() => {
    const offsetP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Current Offset:'))
    const detectedP = Array.from(document.querySelectorAll('p')).find(p => p.textContent?.includes('Detected:'))
    const sliderX = (document.querySelector('input[type="range"]:first-of-type') as HTMLInputElement)
    const sliderY = (document.querySelector('input[type="range"]:last-of-type') as HTMLInputElement)
    
    return {
      offset: offsetP?.textContent || 'Not found',
      detected: detectedP?.textContent || 'Not found',
      sliderXValue: sliderX?.value || 'Not found',
      sliderYValue: sliderY?.value || 'Not found'
    }
  })
  
  console.log('\nState after clicking:')
  console.log(`  ${afterClickState.offset}`)
  console.log(`  ${afterClickState.detected}`)
  console.log(`  Slider X: ${afterClickState.sliderXValue}`)
  console.log(`  Slider Y: ${afterClickState.sliderYValue}`)
  
  // Output captured logs
  console.log('\nCaptured console logs:')
  logs.forEach((log, index) => {
    console.log(`  ${index + 1}: ${log}`)
  })
  
  // Check if Center button click log exists
  const centerClickLog = logs.find(log => log.includes('Center button clicked'))
  if (centerClickLog) {
    console.log(`\n✅ Center button click log: ${centerClickLog}`)
  } else {
    console.log('\n❌ Center button click log not found')
    console.log('Expected pattern: "Center button clicked"')
  }
  
  // Check if offset change logs exist
  const offsetLogs = logs.filter(log => log.includes('Offset changed'))
  console.log(`\nOffset change logs (${offsetLogs.length} items):`)
  offsetLogs.forEach((log, index) => {
    console.log(`  ${index + 1}: ${log}`)
  })
  
  console.log('\n✅ Center button debug completed')
}) 