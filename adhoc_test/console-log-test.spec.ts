import { test } from '@playwright/test'

test('Console log verification test', async ({ page }) => {
  // Capture console logs
  const logs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })
  
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Console Log Verification Test ===')
  
  // Click Center button
  console.log('\nClicking Center button...')
  await page.click('button:text-is("Center")')
  await page.waitForTimeout(1000)
  
  // Output captured logs
  console.log('\nCaptured console logs:')
  logs.forEach((log, index) => {
    console.log(`  ${index + 1}: ${log}`)
  })
  
  // Look for Center button click log (adjust to match actual message format)
  const centerClickLog = logs.find(log => log.includes('Center button clicked'))
  if (centerClickLog) {
    console.log(`\n✅ Center button click log: ${centerClickLog}`)
  } else {
    console.log('\n❌ Center button click log not found')
    console.log('Expected pattern: "Center button clicked"')
  }
  
  // Look for Offset change logs (adjust to match actual message format)
  const offsetLogs = logs.filter(log => log.includes('Offset changed'))
  console.log(`\nOffset change logs (${offsetLogs.length} items):`)
  offsetLogs.forEach((log, index) => {
    console.log(`  ${index + 1}: ${log}`)
  })
}) 