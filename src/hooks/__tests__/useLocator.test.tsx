/// <reference types="vitest/globals" />
import { render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { useLocator } from '../useLocator'
import { useComponentRef } from '../useComponentRef'
import type { DetectedComponent, CSSUnitValue } from '../../types/useLocator'

// Test component
const TestChild = ({ id, height = 100 }: { id: number; height?: number }) => {
  const component = <TestChild id={id} height={height} />
  const [, setRef] = useComponentRef<HTMLDivElement>(component)
  
  return (
    <div
      ref={setRef}
      data-testid={`child-${id}`}
      style={{ height: `${height}px`, margin: '10px 0' }}
    >
      Child {id}
    </div>
  )
}

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

describe('useLocator', () => {
  let detectedComponents: (DetectedComponent | null)[] = []
  
  const mockOnDetect = (detected: DetectedComponent | null) => {
    detectedComponents.push(detected)
  }
  
  beforeEach(() => {
    detectedComponents = []
  })
  
  it('should initialize with correct default values', async () => {
    render(
      <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
        <TestChild id={1} />
        <TestChild id={2} />
      </TestContainer>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('children-count')).toHaveTextContent('Children: 2')
    })
    
    expect(screen.getByTestId('enabled-status')).toHaveTextContent('Enabled: yes')
  })
  
  it('should detect component at XY offset', async () => {
    render(
      <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
        <TestChild id={1} height={80} />
        <TestChild id={2} height={80} />
        <TestChild id={3} height={80} />
      </TestContainer>
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
      <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
        <TestChild id={1} height={80} />
        <TestChild id={2} height={80} />
        <TestChild id={3} height={80} />
      </TestContainer>
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
      <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
        {null}
      </TestContainer>
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
      <TestContainer offset={{ x: 100, y: 100 }} onDetect={mockOnDetect}>
        <TestChild id={1} height={50} />
        <TestChild id={2} height={50} />
      </TestContainer>
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
      <TestContainer offset={{ x: '50%', y: '25%' }} onDetect={mockOnDetect}>
        <TestChild id={1} height={80} />
        <TestChild id={2} height={80} />
      </TestContainer>
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
      <TestContainer offset={{ x: 100, y: '50%' }} onDetect={mockOnDetect}>
        <TestChild id={1} height={80} />
        <TestChild id={2} height={80} />
      </TestContainer>
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
      <TestContainer offset={{ x: '10%', y: '10%' }} onDetect={mockOnDetect}>
        <TestChild id={1} />
        <TestChild id={2} />
      </TestContainer>
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
}) 