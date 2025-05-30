import { test } from '@playwright/test'

test('Button selector verification test', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Button Selector Verification Test ===')
  
  // Get text of all buttons
  const buttonTexts = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return buttons.map((button, index) => ({
      index,
      text: button.textContent?.trim() || '',
      innerHTML: button.innerHTML
    }))
  })
  
  console.log('\nAll button texts:')
  buttonTexts.forEach(button => {
    console.log(`  ${button.index}: "${button.text}"`)
  })
  
  // Find buttons containing "Center"
  const centerButtons = buttonTexts.filter(button => 
    button.text.includes('Center')
  )
  
  console.log(`\nButtons containing "Center" (${centerButtons.length} items):`)
  centerButtons.forEach(button => {
    console.log(`  ${button.index}: "${button.text}"`)
  })
  
  // Find button with exactly "Center" text
  const exactCenterButton = buttonTexts.find(button => 
    button.text === 'Center'
  )
  
  if (exactCenterButton) {
    console.log(`\n✅ Exact "Center" button: index ${exactCenterButton.index} - "${exactCenterButton.text}"`)
  } else {
    console.log('\n❌ Exact "Center" button not found')
  }
  
  // Click Center button with more precise selector
  console.log('\nClicking Center button with precise selector...')
  
  // Capture console logs
  const logs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })
  
  // Click button with exactly "Center" text
  await page.click('button:text-is("Center")')
  await page.waitForTimeout(1000)
  
  // Check recent logs
  const recentLogs = logs.slice(-5) // Latest 5 items
  console.log('\nRecent console logs:')
  recentLogs.forEach((log, index) => {
    console.log(`  ${index + 1}: ${log}`)
  })
}) 