import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocator, withChildLocator } from './index'
import type { DetectedComponent } from './types/useLocator'

interface GridItem {
  id: string
  row: number
  col: number
  x: number
  y: number
}

// Grid item component wrapped with Tether
const BaseGridItem = React.forwardRef<HTMLDivElement, { 
  item: GridItem
  children: React.ReactNode 
}>(({ item, children }, ref) => {
  return (
    <div
      ref={ref}
      data-testid={item.id}
      style={{
        position: 'absolute',
        left: `${item.x + 10}px`,
        top: `${item.y + 10}px`,
        width: '180px',
        height: '130px',
        border: '3px solid #0066cc',
        backgroundColor: '#e6f3ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#0066cc',
        borderRadius: '8px',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  )
})

BaseGridItem.displayName = 'BaseGridItem'

const GridItem = withChildLocator(BaseGridItem)

function App() {
  const [mouseOffset, setMouseOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const childrenCount = 30 // 30 items in 3x10 grid
  const containerRef = useRef<HTMLDivElement>(null)
  const innerContainerRef = useRef<HTMLDivElement>(null)
  const lastMouseEventRef = useRef<{ clientX: number; clientY: number } | null>(null)

  // Use child-locator for component detection (using innerContainerRef)
  useLocator(innerContainerRef, {
    offset: mouseOffset,
    onDetect: (detectedComponent) => {
      setDetected(detectedComponent)
    },
    enabled: true,
    scrollContainerRef: containerRef,
  })

  // Unified coordinate calculation
  const calculateMouseOffset = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const innerRect = innerContainerRef.current?.getBoundingClientRect()
    if (!rect || !innerRect) return null

    // Calculate coordinates relative to innerContainer
    const x = clientX - innerRect.left
    const y = clientY - innerRect.top

    return { x: Math.round(x), y: Math.round(y) }
  }, [])

  // Update coordinates on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!lastMouseEventRef.current) return
      
      const newOffset = calculateMouseOffset(
        lastMouseEventRef.current.clientX,
        lastMouseEventRef.current.clientY
      )
      if (newOffset) {
        setMouseOffset(newOffset)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [calculateMouseOffset])

  // Generate 3x10 grid data
  const gridItems: GridItem[] = []
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 3; col++) {
      const id = `Item-${row + 1}-${col + 1}`
      gridItems.push({
        id,
        row,
        col,
        x: col * 200,
        y: row * 150
      })
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // Record last mouse position
    lastMouseEventRef.current = {
      clientX: event.clientX,
      clientY: event.clientY
    }

    const newOffset = calculateMouseOffset(event.clientX, event.clientY)
    if (newOffset) {
      setMouseOffset(newOffset)
    }
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1>child-locator Test Page - 3x10 Grid</h1>
      
      {/* child-locator detection results display area */}
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
        minHeight: '100px'
      }}>
        <h3>child-locator Detection Information:</h3>
        <div>
          <p><strong>Mouse Coordinates:</strong> X: {mouseOffset.x}px, Y: {mouseOffset.y}px</p>
          <p><strong>Managed Components Count:</strong> {childrenCount}</p>
          <p><strong>Detected Item:</strong> {' '}
            {detected?.element ? (
              (() => {
                const testId = detected.element.getAttribute('data-testid')
                const elementText = detected.element.textContent?.split('\n')[0] // Get the first line of text
                const displayName = testId || elementText || 'Unknown Element'
                return `${displayName} (Distance: ${detected.distanceFromOffset.toFixed(1)}px)`
              })()
            ) : 'None'}
          </p>
          <p><strong>Element Bounds:</strong> {detected?.bounds ? 
            `${detected.bounds.width.toFixed(0)}x${detected.bounds.height.toFixed(0)} at (${detected.bounds.x.toFixed(0)}, ${detected.bounds.y.toFixed(0)})` : 
            '(None)'
          }</p>
        </div>
      </div>

      {/* Scrollable grid area */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{
          width: '100%',
          height: '500px',
          border: '2px solid #333',
          overflow: 'auto',
          position: 'relative',
          backgroundColor: '#fafafa'
        }}
      >
        <div 
          ref={innerContainerRef}
          style={{
            width: '600px',
            height: '1500px',
            position: 'relative'
          }}>
          {/* Mouse position indicator */}
          <div 
            style={{
              position: 'absolute',
              left: `${mouseOffset.x}px`,
              top: `${mouseOffset.y}px`,
              width: '10px',
              height: '10px',
              backgroundColor: 'red',
              borderRadius: '50%',
              zIndex: 1000,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)'
            }}
          />

          {gridItems.map((item) => (
            <GridItem 
              key={item.id} 
              item={item}
              tetherMetadata={{
                itemId: item.id,
                position: { x: item.x, y: item.y },
                row: item.row,
                col: item.col
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div>{item.id}</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  ({item.x}, {item.y})
                </div>
              </div>
            </GridItem>
          ))}
        </div>
      </div>

      <div style={{ 
        marginTop: '15px', 
        fontSize: '14px', 
        color: '#666' 
      }}>
        <p><strong>Description:</strong></p>
        <ul>
          <li>3 columns x 10 rows grid is displayed</li>
          <li>Blue borders make items easy to identify</li>
          <li>Red dot indicates mouse position</li>
          <li><strong>child-locator library</strong> detects elements based on coordinates</li>
          <li>Detailed information of detected elements is displayed at the top</li>
          <li>You can scroll within the area</li>
        </ul>
      </div>
    </div>
  )
}

export default App
