import React, { useRef, useState } from 'react'
import { useLocator, TetherProvider, withTether } from '../'
import type { DetectedComponent } from '../types/useLocator'

// Tethered component for tracking
const BaseChildComponent = ({ 
  id, 
  position, 
  backgroundColor = '#e3f2fd',
  borderColor = '#1976d2'
}: { 
  id: string
  position: { x: number; y: number }
  backgroundColor?: string
  borderColor?: string
}) => {
  return (
    <div
      data-testid={id}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '120px',
        height: '80px',
        padding: '10px',
        backgroundColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: borderColor,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div>{id}</div>
      <small>({position.x}, {position.y})</small>
    </div>
  )
}

const ChildComponent = withTether(BaseChildComponent)

const TestComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 100, y: 100 })
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const childrenCount = 6 // 6つの子コンポーネント

  useLocator(containerRef, {
    offset,
    onDetect: (detectedComponent) => {
      setDetected(detectedComponent)
    },
    enabled: true,
  })

  return (
    <TetherProvider>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h2>Test Component - TetherProvider Implementation</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Controls</h3>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
            <label>
              X Offset: 
              <input 
                type="number" 
                value={offset.x} 
                onChange={(e) => setOffset({...offset, x: parseInt(e.target.value) || 0})}
                style={{ marginLeft: '5px', width: '60px' }}
              />
            </label>
            <label>
              Y Offset: 
              <input 
                type="number" 
                value={offset.y} 
                onChange={(e) => setOffset({...offset, y: parseInt(e.target.value) || 0})}
                style={{ marginLeft: '5px', width: '60px' }}
              />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Detection Status</h3>
          <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
            <div>Children Count: <strong>{childrenCount}</strong></div>
            <div>
              Detected Element: {' '}
              <strong>
                {detected?.element ? 
                  `${detected.element.textContent?.split('(')[0]} (distance: ${detected.distanceFromOffset.toFixed(1)}px)` : 
                  'None'
                }
              </strong>
            </div>
            {detected?.bounds && (
              <div>
                Bounds: {detected.bounds.width.toFixed(0)}x{detected.bounds.height.toFixed(0)} 
                at ({detected.bounds.x.toFixed(0)}, {detected.bounds.y.toFixed(0)})
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <h3>Container</h3>
          <div 
            ref={containerRef}
            style={{ 
              width: '500px', 
              height: '400px', 
              border: '2px solid #333',
              position: 'relative',
              backgroundColor: '#f8f9fa',
              backgroundImage: `
                linear-gradient(to right, #e9ecef 1px, transparent 1px),
                linear-gradient(to bottom, #e9ecef 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          >
            {/* Target indicator */}
            <div 
              style={{
                position: 'absolute',
                left: `${offset.x}px`,
                top: `${offset.y}px`,
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                borderRadius: '50%',
                zIndex: 1000,
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)'
              }}
            />
            
            <ChildComponent 
              id="child-A" 
              position={{ x: 50, y: 50 }}
            />
            <ChildComponent 
              id="child-B" 
              position={{ x: 200, y: 50 }}
              backgroundColor="#e8f5e8" 
              borderColor="#4caf50"
            />
            <ChildComponent 
              id="child-C" 
              position={{ x: 350, y: 50 }}
              backgroundColor="#fff3e0" 
              borderColor="#ff9800"
            />
            <ChildComponent 
              id="child-D" 
              position={{ x: 50, y: 200 }}
              backgroundColor="#fce4ec" 
              borderColor="#e91e63"
            />
            <ChildComponent 
              id="child-E" 
              position={{ x: 200, y: 200 }}
              backgroundColor="#f3e5f5" 
              borderColor="#9c27b0"
            />
            <ChildComponent 
              id="child-F" 
              position={{ x: 350, y: 200 }}
              backgroundColor="#e0f2f1" 
              borderColor="#009688"
            />
          </div>
        </div>
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Red dot shows target coordinates</li>
            <li>Change X/Y offset values to move target</li>
            <li>Uses TetherProvider for component tracking</li>
            <li>Distance shows how far the detected element center is from the target</li>
          </ul>
        </div>
      </div>
    </TetherProvider>
  )
}

export default TestComponent 