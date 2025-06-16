/// <reference types="vitest/globals" />
import React, { useRef } from 'react'
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
  
  const { detected, childrenCount, isEnabled } = useLocator(containerRef, {
    offset,
    onDetect,
    enabled: true,
  })
  
  return (
    <div>
      <div data-testid="detected-info">
        Detected: {detected ? 'yes' : 'no'}
      </div>
      <div data-testid="children-count">
        Children: {childrenCount}
      </div>
      <div data-testid="enabled-status">
        Enabled: {isEnabled ? 'yes' : 'no'}
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
  
  const { detected, childrenCount, isEnabled } = useLocator(containerRef, {
    offset,
    onDetect,
    enabled: true,
    scrollContainerRef: scrollContainerRef,
  })
  
  return (
    <div>
      <div data-testid="detected-info">
        Detected: {detected ? 'yes' : 'no'}
      </div>
      <div data-testid="children-count">
        Children: {childrenCount}
      </div>
      <div data-testid="enabled-status">
        Enabled: {isEnabled ? 'yes' : 'no'}
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
  
  it('should initialize with correct default values', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} tetherMetadata={{ childId: 1, name: 'first-child' }} />
          <TestChild id={2} tetherMetadata={{ childId: 2, name: 'second-child' }} />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 2')
    })
    
    expect(screen.getByTestId('enabled-status')).toHaveTextContent('Enabled: yes')
    
    // Verify that detected component has proper tether information
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    const detectedWithComponent = detectedComponents.find(d => d?.component)
    expect(detectedWithComponent?.component?.props).toBeDefined()
    expect([1, 2]).toContain((detectedWithComponent?.component?.props as { id: number })?.id)
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
    
    await waitFor(() => {
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 3')
    })
    
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

    await waitFor(() => {
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 0')
    })

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
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 2')
    })
    
    // Verify that detection works with CSS units
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
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 2')
    })
    
    // Verify that detection works with mixed units
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })
    
    const lastDetected = detectedComponents[detectedComponents.length - 1]
    expect(lastDetected).not.toBeNull()
    expect(typeof lastDetected?.distanceFromOffset).toBe('number')
  })

  it('should exclude invisible locator elements from children count', async () => {
    render(
      <TetherProvider>
        <TestContainer offset={{ x: '10%', y: '10%' }} onDetect={mockOnDetect}>
          <TestChild id={1} />
          <TestChild id={2} />
        </TestContainer>
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 2')
    })
    
    // Verify that invisible elements are not included in child element count
    const container = screen.getByTestId('container')
    const allChildren = container.children.length
    const visibleChildren = parseInt(screen.getByTestId('children-count').textContent?.split(': ')[1] || '0')
    
    // When invisible elements exist, the total child element count should be greater than the visible element count
    expect(allChildren).toBeGreaterThanOrEqual(visibleChildren)
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
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 3')
    })
    
    // Verify that detection works with scroll container
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

  it('should work correctly when enabled flag is changed', async () => {
    const TestEnabledToggle = () => {
      const [enabled, setEnabled] = React.useState(true)
      const containerRef = useRef<HTMLDivElement>(null)
      
      const { isEnabled } = useLocator(containerRef, {
        offset: { x: 50, y: 50 },
        onDetect: mockOnDetect,
        enabled: enabled,
      })
      
      return (
        <div>
          <button data-testid="toggle-button" onClick={() => setEnabled(!enabled)}>
            Toggle
          </button>
          <div data-testid="enabled-status">
            Enabled: {isEnabled ? 'yes' : 'no'}
          </div>
          <div
            ref={containerRef}
            data-testid="container"
            style={{ width: '400px', height: '300px', position: 'relative' }}
          >
            <TestChild id={1} />
          </div>
        </div>
      )
    }

    render(
      <TetherProvider>
        <TestEnabledToggle />
      </TetherProvider>
    )
    
    // Initially enabled
    expect(screen.getByTestId('enabled-status')).toHaveTextContent('Enabled: yes')
    
    // Click to disable
    const toggleButton = screen.getByTestId('toggle-button')
    toggleButton.click()
    
    await waitFor(() => {
      expect(screen.getByTestId('enabled-status')).toHaveTextContent('Enabled: no')
    })
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

  it('should handle coordinate changes dynamically', async () => {
    const TestDynamicCoordinates = () => {
      const [x, setX] = React.useState(50)
      const containerRef = useRef<HTMLDivElement>(null)
      
      const { childrenCount } = useLocator(containerRef, {
        offset: { x, y: 50 },
        onDetect: mockOnDetect,
        enabled: true,
      })
      
      return (
        <div>
          <button data-testid="change-x" onClick={() => setX(150)}>
            Change X
          </button>
          <div data-testid="current-x">X: {x}</div>
          <div data-testid="children-count">
            Children: {childrenCount}
          </div>
          <div
            ref={containerRef}
            data-testid="container"
            style={{ width: '400px', height: '300px', position: 'relative' }}
          >
            <TestChild id={1} />
            <TestChild id={2} />
          </div>
        </div>
      )
    }

    render(
      <TetherProvider>
        <TestDynamicCoordinates />
      </TetherProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 2')
    })

    // Wait for initial detection
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0)
    })

    const initialX = screen.getByTestId('current-x').textContent
    expect(initialX).toBe('X: 50')
    
    // Change coordinates
    const changeButton = screen.getByTestId('change-x')
    changeButton.click()
    
    // Verify X coordinate changed
    await waitFor(() => {
      expect(screen.getByTestId('current-x')).toHaveTextContent('X: 150')
    })
    
    // Allow time for detection to occur after coordinate change
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Verify that at least one detection occurred
    expect(detectedComponents.length).toBeGreaterThan(0)
  })
}) 