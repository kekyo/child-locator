import React, { useRef, useState } from 'react'
import { useLocator } from '../hooks/useLocator'
import { useComponentRef } from '../hooks/useComponentRef'
import type { DetectedComponent } from '../types/useLocator'

interface ChildItemProps {
  id: string
  content: string
  position: { x: number; y: number }
}

const ChildItem: React.FC<ChildItemProps> = ({ id, content, position }) => {
  const component = <ChildItem id={id} content={content} position={position} />
  const [, setRef] = useComponentRef<HTMLDivElement>(component)
  
  return (
    <div
      ref={setRef}
      data-testid={id}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '120px',
        height: '80px',
        padding: '10px',
        backgroundColor: '#e3f2fd',
        border: '2px solid #1976d2',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#1976d2',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div>{content}</div>
      <small>({position.x}, {position.y})</small>
    </div>
  )
}

export const ScrollableContainerDemo: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 150, y: 100 })
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  
  // Child items positioned within the scrollable content
  const items = [
    { id: 'child-A', content: 'Item A', position: { x: 50, y: 50 } },
    { id: 'child-B', content: 'Item B', position: { x: 200, y: 50 } },
    { id: 'child-C', content: 'Item C', position: { x: 350, y: 50 } },
    { id: 'child-D', content: 'Item D', position: { x: 50, y: 200 } },
    { id: 'child-E', content: 'Item E', position: { x: 200, y: 200 } },
    { id: 'child-F', content: 'Item F', position: { x: 350, y: 200 } },
    { id: 'child-G', content: 'Item G', position: { x: 50, y: 350 } },
    { id: 'child-H', content: 'Item H', position: { x: 200, y: 350 } },
    { id: 'child-I', content: 'Item I', position: { x: 350, y: 350 } },
  ]
  
  const { childrenCount } = useLocator(contentContainerRef, {
    offset,
    onDetect: (detectedComponent: DetectedComponent) => {
      setDetected(detectedComponent)
      console.log('Detected in scrollable container:', detectedComponent)
    },
    enabled: true,
    scrollContainerRef: scrollContainerRef,
  })
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Scrollable Container Demo</h2>
      <p>This demo shows coordinate detection within a scrollable container.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Controls</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label>
            X Offset: 
            <input
              type="number"
              value={offset.x}
              onChange={(e) => setOffset(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
              style={{ marginLeft: '10px', width: '80px', padding: '4px' }}
            />
          </label>
          <label>
            Y Offset: 
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
        <p><strong>Children Count:</strong> {childrenCount}</p>
        <p><strong>Current Offset:</strong> ({offset.x}, {offset.y})</p>
        <p><strong>Detected:</strong> {
          detected?.element 
            ? `${detected.element.textContent} (distance: ${detected.distanceFromOffset.toFixed(1)}px)`
            : 'None'
        }</p>
      </div>
      
      {/* Fixed Header */}
      <div style={{
        height: '60px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
        fontWeight: 'bold',
        flexShrink: 0
      }}>
        Fixed Header (flexShrink: 0)
      </div>
      
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        style={{
          width: '400px',
          height: '300px',
          border: '2px solid #333',
          overflow: 'auto',
          position: 'relative',
          backgroundColor: '#fafafa'
        }}
      >
        {/* Content Container (larger than scroll container) */}
        <div
          ref={contentContainerRef}
          style={{
            width: '600px',
            height: '500px',
            position: 'relative',
            backgroundColor: '#fff',
            backgroundImage: `
              linear-gradient(to right, #f0f0f0 1px, transparent 1px),
              linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        >
          {items.map(item => (
            <ChildItem key={item.id} {...item} />
          ))}
          
          {/* Crosshair to show target position */}
          <div
            style={{
              position: 'absolute',
              left: offset.x - 10,
              top: offset.y - 1,
              width: '20px',
              height: '2px',
              backgroundColor: 'red',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: offset.x - 1,
              top: offset.y - 10,
              width: '2px',
              height: '20px',
              backgroundColor: 'red',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Usage:</strong></p>
        <ul>
          <li>Scroll within the container to see different items</li>
          <li>Adjust X/Y offset to target different positions</li>
          <li>The red crosshair shows the target position</li>
          <li>Detection works correctly even when scrolled</li>
        </ul>
      </div>
    </div>
  )
} 