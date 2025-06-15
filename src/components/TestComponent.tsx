import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useLocator } from '../hooks/useLocator'
import { useComponentRef } from '../hooks/useComponentRef'
import type { DetectedComponent, OffsetCoordinates, CSSUnitValue } from '../types/useLocator'

interface ChildItemProps {
  id: number
  content: string
  gridPosition: { row: number; col: number }
}

const ChildItem: React.FC<ChildItemProps> = ({ id, content, gridPosition }) => {
  const component = <ChildItem id={id} content={content} gridPosition={gridPosition} />
  const [, setRef] = useComponentRef<HTMLDivElement>(component)
  
  return (
    <div
      ref={setRef}
      data-testid={`child-${id}`}
      style={{
        gridRow: gridPosition.row,
        gridColumn: gridPosition.col,
        padding: '10px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        borderRadius: '4px',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '12px',
      }}
    >
      <h4>Item {id}</h4>
      <p>{content}</p>
      <small>({gridPosition.row}, {gridPosition.col})</small>
    </div>
  )
}

export const TestComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState<OffsetCoordinates>({ x: 212, y: 175 })
  const [xInput, setXInput] = useState<string>('212px')
  const [yInput, setYInput] = useState<string>('175px')
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  
  // Grid layout child items - Extended for scroll testing
  const [items] = useState([
    // Original 3x4 grid
    { id: 1, content: 'Top Left', gridPosition: { row: 1, col: 1 } },
    { id: 2, content: 'Top Center', gridPosition: { row: 1, col: 2 } },
    { id: 3, content: 'Top Right', gridPosition: { row: 1, col: 3 } },
    { id: 4, content: 'Middle Left', gridPosition: { row: 2, col: 1 } },
    { id: 5, content: 'Center', gridPosition: { row: 2, col: 2 } },
    { id: 6, content: 'Middle Right', gridPosition: { row: 2, col: 3 } },
    { id: 7, content: 'Bottom Left', gridPosition: { row: 3, col: 1 } },
    { id: 8, content: 'Bottom Center', gridPosition: { row: 3, col: 2 } },
    { id: 9, content: 'Bottom Right', gridPosition: { row: 3, col: 3 } },
    { id: 10, content: 'Extra Item', gridPosition: { row: 4, col: 2 } },
    
    // Extended grid for scroll testing (5x6 grid total)
    { id: 11, content: 'Extended 1', gridPosition: { row: 1, col: 4 } },
    { id: 12, content: 'Extended 2', gridPosition: { row: 1, col: 5 } },
    { id: 13, content: 'Extended 3', gridPosition: { row: 2, col: 4 } },
    { id: 14, content: 'Extended 4', gridPosition: { row: 2, col: 5 } },
    { id: 15, content: 'Extended 5', gridPosition: { row: 3, col: 4 } },
    { id: 16, content: 'Extended 6', gridPosition: { row: 3, col: 5 } },
    { id: 17, content: 'Extended 7', gridPosition: { row: 4, col: 1 } },
    { id: 18, content: 'Extended 8', gridPosition: { row: 4, col: 3 } },
    { id: 19, content: 'Extended 9', gridPosition: { row: 4, col: 4 } },
    { id: 20, content: 'Extended 10', gridPosition: { row: 4, col: 5 } },
    { id: 21, content: 'Extended 11', gridPosition: { row: 5, col: 1 } },
    { id: 22, content: 'Extended 12', gridPosition: { row: 5, col: 2 } },
    { id: 23, content: 'Extended 13', gridPosition: { row: 5, col: 3 } },
    { id: 24, content: 'Extended 14', gridPosition: { row: 5, col: 4 } },
    { id: 25, content: 'Extended 15', gridPosition: { row: 5, col: 5 } },
    { id: 26, content: 'Extended 16', gridPosition: { row: 6, col: 1 } },
    { id: 27, content: 'Extended 17', gridPosition: { row: 6, col: 2 } },
    { id: 28, content: 'Extended 18', gridPosition: { row: 6, col: 3 } },
    { id: 29, content: 'Extended 19', gridPosition: { row: 6, col: 4 } },
    { id: 30, content: 'Extended 20', gridPosition: { row: 6, col: 5 } },
  ])
  
  // Debug log control flag
  const [enableDebugLog, setEnableDebugLog] = useState(false)
  
  // Record last log output time (to prevent excessive log output)
  const lastLogTimeRef = useRef<number>(0)
  
  // Window size and container size state
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  // Function to convert CSS units to px values (for display)
  const convertToPixelsForDisplay = (value: CSSUnitValue, isXCoordinate: boolean = true): number => {
    if (typeof value === 'number') {
      return value
    }

    // Get the actual container size (excluding padding)
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return 0

    const containerStyle = window.getComputedStyle(containerRef.current!)
    const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0
    const paddingTop = parseFloat(containerStyle.paddingTop) || 0
    const paddingRight = parseFloat(containerStyle.paddingRight) || 0
    const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0

    const containerWidth = containerRect.width - paddingLeft - paddingRight
    const containerHeight = containerRect.height - paddingTop - paddingBottom

    if (value.endsWith('%')) {
      const percentage = parseFloat(value)
      return isXCoordinate 
        ? (containerWidth * percentage) / 100
        : (containerHeight * percentage) / 100
    }

    if (value.endsWith('vw')) {
      const vw = parseFloat(value)
      return (window.innerWidth * vw) / 100
    }

    if (value.endsWith('vh')) {
      const vh = parseFloat(value)
      return (window.innerHeight * vh) / 100
    }

    if (value.endsWith('rem')) {
      const rem = parseFloat(value)
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      return rem * rootFontSize
    }

    if (value.endsWith('em')) {
      const em = parseFloat(value)
      const fontSize = parseFloat(getComputedStyle(containerRef.current!).fontSize) || 16
      return em * fontSize
    }

    if (value.endsWith('px')) {
      return parseFloat(value)
    }

    return parseFloat(value) || 0
  }

  // Update offset from text inputs
  const updateOffsetFromInputs = useCallback(() => {
    // Preserve CSS unit strings as-is
    const xValue: CSSUnitValue = xInput.endsWith('px') || xInput.endsWith('%') || xInput.endsWith('vw') || xInput.endsWith('vh') || xInput.endsWith('rem') || xInput.endsWith('em') ? xInput : parseFloat(xInput) || 0
    const yValue: CSSUnitValue = yInput.endsWith('px') || yInput.endsWith('%') || yInput.endsWith('vw') || yInput.endsWith('vh') || yInput.endsWith('rem') || yInput.endsWith('em') ? yInput : parseFloat(yInput) || 0
    setOffset({ x: xValue, y: yValue })
  }, [xInput, yInput])

  // Update offset when input values change
  useEffect(() => {
    updateOffsetFromInputs()
  }, [updateOffsetFromInputs])

  // Monitor window size
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)
    
    return () => window.removeEventListener('resize', updateWindowSize)
  }, [])
  
  // Monitor container size
  useEffect(() => {
    if (!containerRef.current) return
    
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({
          width: rect.width,
          height: rect.height
        })
      }
    }
    
    updateContainerSize()
    
    const resizeObserver = new ResizeObserver(updateContainerSize)
    resizeObserver.observe(containerRef.current)
    
    return () => resizeObserver.disconnect()
  }, [])
  
  // Monitor offset changes (for debugging)
  useEffect(() => {
    console.log(`Offset changed: (${offset.x}, ${offset.y})`)
  }, [offset])
  
  const { childrenCount, isEnabled } = useLocator(containerRef, {
    offset,
    onDetect: (detectedComponent: DetectedComponent) => {
      setDetected(detectedComponent)
      
      // Debug log control (prevent excessive output)
      if (enableDebugLog) {
        const now = Date.now()
        if (now - lastLogTimeRef.current > 100) { // Only output logs at 100ms intervals
          lastLogTimeRef.current = now
          console.log('Detected component:', detectedComponent)
          if (detectedComponent) {
            console.log('Offset coordinates:', offset)
            console.log('Distance from offset:', detectedComponent.distanceFromOffset)
            console.log('Window size:', windowSize)
            console.log('Container size:', containerSize)
            if (!detectedComponent?.element) {
              console.log('No child elements at offset position')
            }
          }
        }
      }
    },
    enabled: true,
  })
  
  // Preset coordinates (including both CSS units and px values)
  const presetCoordinates = [
    { name: 'Top Left', x: '75px', y: '63px' },
    { name: 'Top Center', x: '212px', y: '63px' },
    { name: 'Top Right', x: '349px', y: '63px' },
    { name: 'Middle Left', x: '75px', y: '175px' },
    { name: 'Center', x: '212px', y: '175px' },
    { name: 'Middle Right', x: '349px', y: '175px' },
    { name: 'Bottom Left', x: '75px', y: '287px' },
    { name: 'Bottom Center', x: '212px', y: '287px' },
    { name: 'Bottom Right', x: '349px', y: '287px' },
    { name: 'Extra Item', x: '212px', y: '399px' },
    // CSS unit presets
    { name: '25%', x: '25%', y: '25%' },
    { name: '50%', x: '50%', y: '50%' },
    { name: '75%', x: '75%', y: '75%' },
  ]
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>useLocator Hook Test - CSS Units Support</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Offset Coordinates Control (CSS Units Supported)</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
          <label>
            X Offset: 
            <input
              type="text"
              value={xInput}
              onChange={(e) => setXInput(e.target.value)}
              placeholder="e.g., 212px, 50%, 10vw"
              style={{ marginLeft: '10px', width: '120px', padding: '4px' }}
            />
          </label>
          <label>
            Y Offset: 
            <input
              type="text"
              value={yInput}
              onChange={(e) => setYInput(e.target.value)}
              placeholder="e.g., 175px, 25%, 5vh"
              style={{ marginLeft: '10px', width: '120px', padding: '4px' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Preset Coordinates:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
            {presetCoordinates.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  console.log(`${preset.name} button clicked: (${preset.x}, ${preset.y})`)
                  setXInput(preset.x)
                  setYInput(preset.y)
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: xInput === preset.x && yInput === preset.y ? '#007bff' : '#f8f9fa',
                  color: xInput === preset.x && yInput === preset.y ? 'white' : 'black',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <strong>Supported CSS Units:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li><strong>px</strong>: Pixel values (e.g., 212px)</li>
            <li><strong>%</strong>: Relative to parent container (e.g., 50%)</li>
            <li><strong>vw/vh</strong>: Relative to viewport (e.g., 10vw, 5vh)</li>
            <li><strong>rem/em</strong>: Relative to font size (e.g., 2rem)</li>
          </ul>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            checked={enableDebugLog}
            onChange={(e) => setEnableDebugLog(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Enable Debug Log
        </label>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Children Count: {childrenCount}</p>
        <p>Monitoring Enabled: {isEnabled ? 'Yes' : 'No'}</p>
        <p>Window Size: {windowSize.width} x {windowSize.height}</p>
        <p>Container Size: {containerSize.width.toFixed(0)} x {containerSize.height.toFixed(0)}</p>
        <p>Current Offset: ({xInput}, {yInput})</p>
        <p>Calculated Position: ({convertToPixelsForDisplay(offset.x, true).toFixed(0)}px, {convertToPixelsForDisplay(offset.y, false).toFixed(0)}px)</p>
        <p>
          Detected: {detected ? (detected.element ? `Item ${detected.element.textContent?.match(/Item (\d+)/)?.[1] || 'Unknown'}` : 'No child elements') : 'None'}
        </p>
        {detected && (
          <p>Distance from offset: {detected.distanceFromOffset.toFixed(1)}px</p>
        )}
      </div>
      
      <div style={{ position: 'relative' }}>
        {/* Crosshair showing XY coordinate offset position */}
        <div
          style={{
            position: 'absolute',
            left: `${convertToPixelsForDisplay(offset.x, true) - 10}px`,
            top: `${convertToPixelsForDisplay(offset.y, false)}px`,
            width: '20px',
            height: '2px',
            backgroundColor: 'red',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${convertToPixelsForDisplay(offset.x, true)}px`,
            top: `${convertToPixelsForDisplay(offset.y, false) - 10}px`,
            width: '2px',
            height: '20px',
            backgroundColor: 'red',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
        
        <div
          ref={containerRef}
          data-testid="container"
          style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '10px',
            width: '400px',
            height: '400px',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 120px)', // 5 columns, each 120px wide
            gridTemplateRows: 'repeat(6, 100px)', // 6 rows, each 100px tall
            gap: '10px',
            position: 'relative',
            overflow: 'auto', // Enable scrolling
            // Total content size: 5 * 120px + 4 * 10px (gaps) = 640px width
            // Total content size: 6 * 100px + 5 * 10px (gaps) = 650px height
            // Container size: 400px x 400px, so scrolling will occur
          }}
        >
          {items.map((item) => (
            <ChildItem
              key={item.id}
              id={item.id}
              content={item.content}
              gridPosition={item.gridPosition}
            />
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>CSS Units Test Instructions:</h3>
        <ol>
          <li>Use the X/Y text inputs to specify coordinates with CSS units</li>
          <li>Try different units: px, %, vw, vh, rem, em</li>
          <li>Click preset coordinate buttons to test common positions</li>
          <li>Enable Debug Log to see detailed detection information</li>
          <li>Observe how different coordinates detect different grid items</li>
          <li>Verify that the closest item to the crosshair is always detected</li>
          <li>Test container scrolling: The grid container can scroll both horizontally and vertically</li>
          <li>Test window scrolling: Scroll the entire page to test window-level detection</li>
          <li>Test responsive behavior: Resize the window to see how % and vw/vh units adapt</li>
        </ol>
      </div>
      
      {/* Additional content for window-level scrolling test */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#e8f4f8', borderRadius: '8px' }}>
        <h3>Window Scroll Test Area</h3>
        <p>This section provides additional content to enable window-level scrolling for comprehensive testing.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`window-scroll-${i}`}
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                minHeight: '150px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <h4>Window Scroll Item {i + 1}</h4>
              <p>Content for window-level scroll testing</p>
              <p>Position: Row {Math.floor(i / 3) + 1}, Col {(i % 3) + 1}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f8e8', borderRadius: '8px' }}>
        <h3>Extended Test Content</h3>
        <p>Additional content to ensure sufficient page height for window scrolling tests.</p>
        
        <div style={{ marginTop: '20px' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`extended-${i}`}
              style={{
                padding: '15px',
                margin: '10px 0',
                backgroundColor: '#ffffff',
                border: '1px solid #ccc',
                borderRadius: '6px',
              }}
            >
              <h4>Extended Content Block {i + 1}</h4>
              <p>This block provides additional vertical space for window scrolling tests.</p>
              <p>Block height varies to create diverse scroll positions for testing.</p>
              {i % 2 === 0 && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9' }}>
                  <p>Additional nested content for even-numbered blocks.</p>
                  <p>This creates more varied content heights and scroll positions.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 