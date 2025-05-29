import React, { useRef, useState, useEffect } from 'react'
import { useLocator } from '../hooks/useLocator'
import { useComponentRef } from '../hooks/useComponentRef'
import type { DetectedComponent, OffsetCoordinates } from '../types/useLocator'

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
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  
  // Grid layout child items
  const [items] = useState([
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
  ])
  
  // Debug log control flag
  const [enableDebugLog, setEnableDebugLog] = useState(false)
  
  // Record last log output time (to prevent excessive log output)
  const lastLogTimeRef = useRef<number>(0)
  
  // Window size and container size state
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
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
  
  // Preset coordinates (based on actual grid layout)
  const presetCoordinates = [
    { name: 'Top Left', x: 75, y: 63 },
    { name: 'Top Center', x: 212, y: 63 },
    { name: 'Top Right', x: 349, y: 63 },
    { name: 'Middle Left', x: 75, y: 175 },
    { name: 'Center', x: 212, y: 175 },
    { name: 'Middle Right', x: 349, y: 175 },
    { name: 'Bottom Left', x: 75, y: 287 },
    { name: 'Bottom Center', x: 212, y: 287 },
    { name: 'Bottom Right', x: 349, y: 287 },
    { name: 'Extra Item', x: 212, y: 399 },
  ]
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>useLocator Hook Test - XY Coordinate Detection</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Offset Coordinates Control</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
          <label>
            X Offset: 
            <input
              type="range"
              min="0"
              max="424"
              value={offset.x}
              onChange={(e) => setOffset(prev => ({ ...prev, x: Number(e.target.value) }))}
              style={{ marginLeft: '10px' }}
            />
            {offset.x}px
          </label>
          <label>
            Y Offset: 
            <input
              type="range"
              min="0"
              max="424"
              value={offset.y}
              onChange={(e) => setOffset(prev => ({ ...prev, y: Number(e.target.value) }))}
              style={{ marginLeft: '10px' }}
            />
            {offset.y}px
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
                  setOffset({ x: preset.x, y: preset.y })
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: offset.x === preset.x && offset.y === preset.y ? '#007bff' : '#f8f9fa',
                  color: offset.x === preset.x && offset.y === preset.y ? 'white' : 'black',
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
        <p>Current Offset: ({offset.x}, {offset.y})</p>
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
            left: `${offset.x - 10}px`,
            top: `${offset.y}px`,
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
            left: `${offset.x}px`,
            top: `${offset.y - 10}px`,
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '10px',
            position: 'relative',
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
        <h3>XY Coordinate Test Instructions:</h3>
        <ol>
          <li>Use the X/Y sliders to move the detection point (red crosshair)</li>
          <li>Click preset coordinate buttons to jump to specific positions</li>
          <li>Enable Debug Log to see detailed detection information</li>
          <li>Observe how different coordinates detect different grid items</li>
          <li>Verify that the closest item to the crosshair is always detected</li>
        </ol>
      </div>
    </div>
  )
} 