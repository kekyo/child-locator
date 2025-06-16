import React, { useRef, useState } from 'react'
import { useLocator, TetherProvider, withTether } from '../'
import type { DetectedComponent } from '../types/useLocator'

// Tethered component for tracking
const BaseMockComponent = ({ 
  children, 
  height = 60, 
  backgroundColor = '#f0f0f0',
  borderColor = '#ccc'
}: { 
  children: React.ReactNode
  height?: number
  backgroundColor?: string
  borderColor?: string
}) => {
  return (
    <div
      style={{
        height: `${height}px`,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        margin: '8px',
        padding: '8px',
        borderRadius: '4px',
      }}
    >
      {children}
    </div>
  )
}

const MockComponent = withTether(BaseMockComponent)

const ScrollableContainerDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const [offset, setOffset] = useState({ x: 50, y: 100 })

  const { childrenCount } = useLocator(containerRef, {
    offset,
    onDetect: setDetected,
    enabled: true,
    scrollContainerRef,
  })

  return (
    <TetherProvider>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h2>Scrollable Container Demo - TetherProvider Implementation</h2>
        
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
                  `Element found (distance: ${detected.distanceFromOffset.toFixed(1)}px)` : 
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

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3>Scrollable Container</h3>
            <div 
              ref={scrollContainerRef}
              style={{ 
                height: '400px', 
                border: '2px solid #333',
                overflow: 'auto',
                position: 'relative',
                backgroundColor: '#fff'
              }}
            >
              <div 
                ref={containerRef}
                style={{ 
                  minHeight: '800px',
                  padding: '10px',
                  position: 'relative'
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
                
                <MockComponent>
                  Component 1 - Regular height
                </MockComponent>
                
                <MockComponent height={120} backgroundColor="#e6f3ff" borderColor="#0066cc">
                  Component 2 - Tall and blue
                </MockComponent>
                
                <MockComponent backgroundColor="#fff0e6" borderColor="#ff6600">
                  Component 3 - Orange theme
                </MockComponent>
                
                <MockComponent height={80} backgroundColor="#f0fff0" borderColor="#00cc66">
                  Component 4 - Green theme
                </MockComponent>
                
                <MockComponent>
                  Component 5 - Regular height
                </MockComponent>
                
                <MockComponent height={100}>
                  Component 6 - Medium height
                </MockComponent>
                
                <MockComponent backgroundColor="#fff0ff" borderColor="#cc00cc">
                  Component 7 - Purple theme
                </MockComponent>
                
                <MockComponent>
                  Component 8 - At bottom
                </MockComponent>
              </div>
            </div>
          </div>
          
          <div style={{ width: '300px' }}>
            <h3>Instructions</h3>
            <ul style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <li>Red dot shows target coordinates</li>
              <li>Scroll the container to test detection</li>
              <li>Change X/Y offset values to move target</li>
              <li>Uses TetherProvider for component tracking</li>
              <li>Distance shows how far the detected element center is from the target</li>
            </ul>
          </div>
        </div>
      </div>
    </TetherProvider>
  )
}

export default ScrollableContainerDemo 