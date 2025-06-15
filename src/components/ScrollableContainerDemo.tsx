import React, { useRef, useState } from 'react'
import { useLocator } from '../hooks/useLocator'
import { useComponentRef } from '../hooks/useComponentRef'
import type { DetectedComponent } from '../types/useLocator'

interface ChildItemProps {
  id: number
  content: string
}

const ChildItem: React.FC<ChildItemProps> = ({ id, content }) => {
  const component = <ChildItem id={id} content={content} />
  const [, setRef] = useComponentRef<HTMLDivElement>(component)
  
  return (
    <div
      ref={setRef}
      data-testid={`child-${id}`}
      style={{
        width: '150px',
        height: '100px',
        margin: '10px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
      }}
    >
      {content}
    </div>
  )
}

export const ScrollableContainerDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const [offset, setOffset] = useState({ x: 100, y: 150 })
  
  const { childrenCount, isEnabled } = useLocator(containerRef, {
    offset,
    onDetect: (detectedComponent: DetectedComponent) => {
      setDetected(detectedComponent)
      console.log('Detected component:', detectedComponent)
    },
    enabled: true,
    scrollContainer: scrollContainerRef, // Specify scroll container
  })
  
  const items = [
    { id: 1, content: 'Item 1' },
    { id: 2, content: 'Item 2' },
    { id: 3, content: 'Item 3' },
    { id: 4, content: 'Item 4' },
    { id: 5, content: 'Item 5' },
    { id: 6, content: 'Item 6' },
    { id: 7, content: 'Item 7' },
    { id: 8, content: 'Item 8' },
  ]
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Child Locator with Scrollable Container</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Coordinate Controls</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label>
            X Coordinate: 
            <input
              type="number"
              value={offset.x}
              onChange={(e) => setOffset(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
              style={{ marginLeft: '10px', width: '80px', padding: '4px' }}
            />
          </label>
          <label>
            Y Coordinate: 
            <input
              type="number"
              value={offset.y}
              onChange={(e) => setOffset(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
              style={{ marginLeft: '10px', width: '80px', padding: '4px' }}
            />
          </label>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Children Count: {childrenCount}</p>
        <p>Monitoring Status: {isEnabled ? 'Enabled' : 'Disabled'}</p>
        <p>Current Coordinates: ({offset.x}, {offset.y})</p>
        <p>
          Detection Result: {detected ? (detected.element ? `${detected.element.textContent}` : 'No child elements') : 'None'}
        </p>
        {detected && detected.element && (
          <p>Distance from Coordinates: {detected.distanceFromOffset.toFixed(1)}px</p>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', height: '500px', border: '2px solid #333' }}>
        {/* Fixed Header */}
        <div 
          style={{ 
            height: '60px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          Fixed Header (flexShrink: 0)
        </div>
        
        {/* Scrollable Content Area */}
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#f9f9f9',
            position: 'relative',
            border: '1px solid #ddd'
          }}
        >
          {/* Coordinate Indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${offset.x}px`,
              top: `${offset.y}px`,
              width: '10px',
              height: '10px',
              backgroundColor: 'red',
              borderRadius: '50%',
              zIndex: 10,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)'
            }}
          />
          
          {/* Child Elements Container */}
          <div
            ref={containerRef}
            style={{
              padding: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              minHeight: '800px', // Set height to enable scrolling
            }}
          >
            {items.map(item => (
              <ChildItem key={item.id} id={item.id} content={item.content} />
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Usage Instructions:</strong></p>
        <ul>
          <li>Adjust X and Y coordinates using the controls above</li>
          <li>The red dot indicates the specified coordinate position</li>
          <li>Even when scrolling the scrollable area, coordinates are calculated relative to the content area</li>
          <li>The detection result shows the closest child element</li>
        </ul>
      </div>
    </div>
  )
} 