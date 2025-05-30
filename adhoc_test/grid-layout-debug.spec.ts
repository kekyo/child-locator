import { test } from '@playwright/test'

test('Grid layout element position verification', async ({ page }) => {
  await page.goto('http://localhost:59517')
  await page.waitForTimeout(1000)
  
  console.log('=== Grid Layout Element Position Verification ===')
  
  // Get actual position of each item
  const itemPositions = await page.evaluate(() => {
    const container = document.querySelector('[data-testid="container"]') as HTMLElement
    const containerRect = container.getBoundingClientRect()
    
    const items: Array<{
      id: number;
      centerX: number;
      centerY: number;
      width: number;
      height: number;
      content: string | undefined;
    }> = []
    for (let i = 1; i <= 10; i++) {
      const element = document.querySelector(`[data-testid="child-${i}"]`) as HTMLElement
      if (element) {
        const rect = element.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2 - containerRect.left
        const centerY = rect.top + rect.height / 2 - containerRect.top
        
        items.push({
          id: i,
          centerX: Math.round(centerX),
          centerY: Math.round(centerY),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          content: element.textContent?.replace(/\s+/g, ' ').trim()
        })
      }
    }
    
    return {
      containerSize: {
        width: Math.round(containerRect.width),
        height: Math.round(containerRect.height)
      },
      items
    }
  })
  
  console.log(`Container size: ${itemPositions.containerSize.width} x ${itemPositions.containerSize.height}`)
  console.log('\nCenter coordinates of each item:')
  
  itemPositions.items.forEach(item => {
    console.log(`Item ${item.id}: (${item.centerX}, ${item.centerY}) - ${item.content}`)
  })
  
  // Generate recommended preset coordinates
  console.log('\nRecommended preset coordinates:')
  const presetMapping = [
    { id: 1, name: 'Top Left' },
    { id: 2, name: 'Top Center' },
    { id: 3, name: 'Top Right' },
    { id: 4, name: 'Middle Left' },
    { id: 5, name: 'Center' },
    { id: 6, name: 'Middle Right' },
    { id: 7, name: 'Bottom Left' },
    { id: 8, name: 'Bottom Center' },
    { id: 9, name: 'Bottom Right' },
    { id: 10, name: 'Extra Item' }
  ]
  
  presetMapping.forEach(preset => {
    const item = itemPositions.items.find(i => i.id === preset.id)
    if (item) {
      console.log(`{ name: '${preset.name}', x: ${item.centerX}, y: ${item.centerY} },`)
    }
  })
}) 