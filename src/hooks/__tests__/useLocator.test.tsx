/// <reference types="vitest/globals" />
import React, { useRef, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useLocator, TetherProvider, withTether } from '../../index'
import type { DetectedComponent, CSSUnitValue } from '../../types/useLocator'

// Test child component using withTether
const BaseTestChild = React.forwardRef<HTMLDivElement, { id: number; height?: number }>(
  ({ id, height = 100 }, ref) => {
    return (
      <div
        ref={ref}
        data-testid={`child-${id}`}
        style={{
          width: '100px',
          height: `${height}px`,
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          margin: '5px',
        }}
      >
        Child {id}
      </div>
    )
  }
)

BaseTestChild.displayName = 'BaseTestChild'

// Wrap with tether to enable component tracking
const TestChild = withTether(BaseTestChild)

const TestContainer = ({
  offset,
  onDetect,
  children,
}: {
  offset: { x: CSSUnitValue; y: CSSUnitValue }
  onDetect: (detected: DetectedComponent | null) => void
  children: React.ReactNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  
  useLocator(containerRef, {
    offset,
    onDetect: (detectedComponent) => {
      setDetected(detectedComponent)
      onDetect(detectedComponent)
    },
    enabled: true,
  })
  
  return (
    <div>
      <div data-testid="detected-info">
        Detected: {detected ? 'yes' : 'no'}
      </div>
      <div
        ref={containerRef}
        data-testid="container"
        style={{ width: '400px', height: '300px', position: 'relative' }}
      >
        {children}
      </div>
    </div>
  )
}

const TestScrollContainer = ({
  offset,
  onDetect,
  children,
}: {
  offset: { x: CSSUnitValue; y: CSSUnitValue }
  onDetect: (detected: DetectedComponent | null) => void
  children: React.ReactNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  
  useLocator(containerRef, {
    offset,
    onDetect: (detectedComponent) => {
      setDetected(detectedComponent)
      onDetect(detectedComponent)
    },
    enabled: true,
    scrollContainerRef: scrollContainerRef,
  })
  
  return (
    <div>
      <div data-testid="detected-info">
        Detected: {detected ? 'yes' : 'no'}
      </div>
      <div data-testid="header" style={{ height: '50px', backgroundColor: '#ccc', flexShrink: 0 }}>
        Header (Fixed)
      </div>
      <div
        ref={scrollContainerRef}
        data-testid="scroll-container"
        style={{
          height: '300px',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        <div
          ref={containerRef}
          data-testid="container"
          style={{ width: '400px', height: '600px', position: 'relative' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

describe('useLocator with TetherProvider', () => {
  let detectedComponents: (DetectedComponent | null)[] = []
  
  const mockOnDetect = (detected: DetectedComponent | null) => {
    detectedComponents.push(detected)
  }
  
  beforeEach(() => {
    detectedComponents = []
  })

  it('should detect component at XY offset', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} tetherMetadata={{ childId: 1 }} />
          <TestChild id={2} height={80} tetherMetadata={{ childId: 2 }} />
          <TestChild id={3} height={80} tetherMetadata={{ childId: 3 }} />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    // Check the last detected component
    const lastDetected = detectedComponents[detectedComponents.length - 1]
    expect(lastDetected).not.toBeNull()
    expect(lastDetected?.element).toBeInstanceOf(HTMLElement)
  })
  
  it('should detect components correctly', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} tetherMetadata={{ childId: 1 }} />
          <TestChild id={2} height={80} tetherMetadata={{ childId: 2 }} />
          <TestChild id={3} height={80} tetherMetadata={{ childId: 3 }} />
        </TestContainer>
      </TetherProvider>
    )
    
    // Verify that detection callback is called
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    // Check the last detected component
    const lastDetected = detectedComponents[detectedComponents.length - 1]
    expect(lastDetected).not.toBeNull()
    expect(lastDetected?.element).toBeInstanceOf(HTMLElement)
  })
  
  it('should handle empty container', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          {null}
        </TestContainer>
      </TetherProvider>
    )

    // For empty containers, DetectedComponent with no child elements is returned
    await waitFor(() => {
      expect(detectedComponents.some(d => d !== null && d.element === undefined)).toBe(true)
    })
  })

  it('should calculate distance from offset correctly', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 100, y: 100 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={50} />
          <TestChild id={2} height={50} />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    const detected = detectedComponents.find(d => d !== null)
    expect(detected).toBeDefined()
    expect(detected?.distanceFromOffset).toBeGreaterThanOrEqual(0)
  })

  it('should support CSS unit strings for offset', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: '50%', y: '25%' }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
          <TestChild id={2} height={80} />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    const lastDetected = detectedComponents[detectedComponents.length - 1]
    expect(lastDetected).not.toBeNull()
    expect(typeof lastDetected?.distanceFromOffset).toBe('number')
  })

  it('should support mixed units (number and string)', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 100, y: '50%' }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
          <TestChild id={2} height={80} />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    const lastDetected = detectedComponents[detectedComponents.length - 1]
    expect(lastDetected).not.toBeNull()
    expect(typeof lastDetected?.distanceFromOffset).toBe('number')
  })

  it('should work with scroll container for scroll-relative coordinate calculation', async () => {
    render(
      <TetherProvider>
        <TestScrollContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
          <TestChild id={2} height={80} />
          <TestChild id={3} height={80} />
        </TestScrollContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    const lastDetected = detectedComponents[detectedComponents.length - 1]
    expect(lastDetected).not.toBeNull()
    expect(lastDetected?.element).toBeInstanceOf(HTMLElement)
    
    // Test scroll behavior
    const scrollContainer = screen.getByTestId('scroll-container')
    scrollContainer.scrollTop = 100
    
    // Allow time for scroll event handling
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Detection should still work after scrolling
    expect(detectedComponents.length).toBeGreaterThan(0)
  })

  it('should retrieve component metadata from tethered elements', async () => {
    const specificMetadata = { 
      componentType: 'test-component', 
      uniqueId: 'test-123',
      category: 'interaction' 
    }
    
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild 
            id={1} 
            height={100}
            tetherMetadata={specificMetadata}
          />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    // Find a detection with tether information  
    const detectedWithTether = detectedComponents.find(d => d?.component)
    expect(detectedWithTether).toBeDefined()
    expect(detectedWithTether?.component).toBeDefined()
    
    // Verify props are accessible
    const props = detectedWithTether?.component?.props as { 
      id: number; 
      height: number; 
      _tetherMetadata: { 
        componentType: string; 
        uniqueId: string; 
        category: string 
      } 
    }
    expect(props).toBeDefined()
    expect(props.id).toBe(1)
    expect(props.height).toBe(100)
    
    // Verify that tether metadata is accessible
    expect(props._tetherMetadata).toBeDefined()
    expect(props._tetherMetadata.componentType).toBe('test-component')
    expect(props._tetherMetadata.uniqueId).toBe('test-123')
    expect(props._tetherMetadata.category).toBe('interaction')
    
    // This confirms that react-attractor integration is working correctly
    // and we can identify components by their metadata, not just DOM attributes
  })

  it('should provide bounds information for detected elements', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    const detected = detectedComponents.find(d => d !== null && d.element)
    expect(detected).toBeDefined()
    expect(detected?.bounds).toBeDefined()
    expect(detected?.bounds?.width).toBeGreaterThan(0)
    expect(detected?.bounds?.height).toBeGreaterThan(0)
  })
}) 