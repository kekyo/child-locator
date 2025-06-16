import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import type { RefObject } from 'react'
import { useTetherContext } from 'react-attractor'
import type { DetectedComponent, UseLocatorOptions, UseLocatorReturn, OffsetCoordinates } from '../types/useLocator'
import { InvisibleElementManager } from '../utils/invisibleElementManager'

/**
 * Find element at specified offset coordinates
 */
function findElementAtOffset(
  container: HTMLElement,
  offset: OffsetCoordinates,
  scrollContainer?: RefObject<HTMLElement | null> | null
): HTMLElement | null {
  const manager = new InvisibleElementManager()
  manager.setContainer(container)
  
  try {
    const pixelOffset = manager.getPositionFromCSSUnits(offset.x, offset.y)
    if (!pixelOffset) {
      return null
    }
    
    let targetX: number, targetY: number
    
    // Calculate absolute viewport coordinates considering scroll container
    if (scrollContainer?.current) {
      const containerRect = scrollContainer.current.getBoundingClientRect()
      const scrollLeft = scrollContainer.current.scrollLeft
      const scrollTop = scrollContainer.current.scrollTop
      
      // Calculate coordinates relative to scroll container content
      targetX = containerRect.left + pixelOffset.x - scrollLeft
      targetY = containerRect.top + pixelOffset.y - scrollTop
    } else {
      const containerRect = container.getBoundingClientRect()
      targetX = containerRect.left + pixelOffset.x
      targetY = containerRect.top + pixelOffset.y
    }
    
    // Check if coordinates are within viewport bounds
    const isInViewport = targetX >= 0 && targetX <= window.innerWidth && 
                        targetY >= 0 && targetY <= window.innerHeight
    
    let element: Element | null = null
    
    if (isInViewport) {
      // Primary method: Use document.elementFromPoint for viewport coordinates
      element = document.elementFromPoint(targetX, targetY)
      
      // Find the closest direct child element of the container
      while (element && element !== container) {
        if (InvisibleElementManager.isLocatorInvisibleElement(element)) {
          element = element.parentElement
          continue
        }
        
        if (element.parentElement === container) {
          return element as HTMLElement
        }
        
        element = element.parentElement
      }
    }
    
    // Fallback method: Use bounds checking for out-of-viewport coordinates
    if (!element) {
      return findElementByBounds(container, targetX, targetY)
    }
    
    return null
  } finally {
    manager.cleanup()
  }
}

/**
 * Fallback element detection using getBoundingClientRect
 */
function findElementByBounds(
  container: HTMLElement,
  targetX: number,
  targetY: number
): HTMLElement | null {
  const children = InvisibleElementManager.getVisibleChildren(container)
  
  const candidates: Array<{
    element: HTMLElement
    distance: number
    bounds: DOMRect
  }> = []
  
  children.forEach(child => {
    const rect = child.getBoundingClientRect()
    
    const isWithinBounds = 
      targetX >= rect.left && targetX <= rect.right &&
      targetY >= rect.top && targetY <= rect.bottom
    
    if (isWithinBounds) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distance = Math.sqrt(
        Math.pow(centerX - targetX, 2) + 
        Math.pow(centerY - targetY, 2)
      )
      
      candidates.push({
        element: child as HTMLElement,
        distance,
        bounds: rect
      })
    }
  })
  
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const distanceDiff = a.distance - b.distance
      if (Math.abs(distanceDiff) < 0.1) {
        const aIndex = Array.from(container.children).indexOf(a.element)
        const bIndex = Array.from(container.children).indexOf(b.element)
        return bIndex - aIndex
      }
      return distanceDiff
    })
    
    return candidates[0].element
  }
  
  return null
}

/**
 * A Hook that monitors child components of a specified component and
 * identifies child components at XY coordinate offset positions
 * Uses react-attractor for component registration and retrieval
 */
export const useTetheredLocator = (
  refTarget: RefObject<HTMLElement | null>,
  options: UseLocatorOptions
): UseLocatorReturn => {
  const { offset, onDetect, enabled = true, scrollContainerRef } = options
  
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const [childrenCount, setChildrenCount] = useState(0)
  
  // Get tether context for component registration/retrieval
  const { getTether } = useTetherContext()
  
  // Maintain Observer references for cleanup
  const observersRef = useRef<{
    mutation?: MutationObserver
    resize?: ResizeObserver
    intersection?: IntersectionObserver
  }>({})
  
  // Stably maintain previous detection results to prevent unnecessary re-renders
  const lastResultRef = useRef<string>('')
  
  // Detection process execution flag for debouncing multiple rapid calls
  const processingRef = useRef(false)
  
  // Ref to reference current values to avoid circular dependencies in useCallback
  const currentValuesRef = useRef({ offset, enabled, onDetect, scrollContainerRef })
  currentValuesRef.current = { offset, enabled, onDetect, scrollContainerRef }
  
  // Determine effective scroll container with automatic fallback to containerRef if scrollable
  const effectiveScrollContainer = useMemo((): RefObject<HTMLElement | null> | null => {
    // If explicitly specified, use it
    if (scrollContainerRef) {
      return scrollContainerRef
    }
    
    // Check if containerRef itself is scrollable and use it as scroll container
    if (refTarget.current) {
      const style = getComputedStyle(refTarget.current)
      const isScrollable = 
        style.overflow !== 'visible' || 
        style.overflowX !== 'visible' || 
        style.overflowY !== 'visible'
      
      if (isScrollable) {
        return refTarget
      }
    }
    
    // No scroll container (use window scrolling)
    return null
  }, [scrollContainerRef, refTarget])
  
  // Function to convert CSS units to px values for coordinate calculations
  const convertToPixels = useCallback((
    container: HTMLElement,
    x: number | string,
    y: number | string
  ): { x: number; y: number } => {
    // Return as-is if it's already a number (px value)
    if (typeof x === 'number' && typeof y === 'number') {
      return { x, y }
    }
    
    // For CSS units, use invisible element for accurate conversion
    const manager = new InvisibleElementManager()
    manager.setContainer(container)
    
    try {
      const position = manager.getPositionFromCSSUnits(x, y)
      return position || { x: 0, y: 0 }
    } finally {
      manager.cleanup()
    }
  }, [])

  // Function to get component from element using tether context
  const getComponentFromElement = useCallback((element: HTMLElement) => {
    const tetherInfo = getTether(element)
    if (tetherInfo) {
      // Create a React element from the tether information
      return {
        type: 'div', // Default type, could be extracted from tether metadata
        props: {
          ...tetherInfo.props,
          // Include metadata in a special property for easy access
          _tetherMetadata: tetherInfo.metadata
        },
        key: null,
        ref: null,
      }
    }
    return undefined
  }, [getTether])

  // Stabilize onDetect callback to prevent unnecessary effect re-runs
  const stableOnDetect = useCallback((component: DetectedComponent) => {
    // Hash the result to detect meaningful changes and avoid redundant calls
    const hash = JSON.stringify({
      hasElement: !!component.element,
      testId: component.element?.getAttribute('data-testid') || null,
      distance: Math.round(component.distanceFromOffset * 10) / 10, // Round to 1 decimal place
    })
    
    // Do nothing if same as previous result
    if (lastResultRef.current === hash) {
      return
    }
    
    lastResultRef.current = hash
    setDetected(component)
    currentValuesRef.current.onDetect(component)
  }, [])
  
  // Main detection logic with debouncing to avoid excessive processing
  const detectComponent = useCallback(() => {
    const { offset: currentOffset, enabled: currentEnabled } = currentValuesRef.current
    const currentScrollContainer = effectiveScrollContainer
    
    // Skip if already processing or conditions not met
    if (processingRef.current || !refTarget.current || !currentEnabled) {
      return
    }
    
    processingRef.current = true
    
    // Execute in next event loop to avoid React re-rendering cycle conflicts
    setTimeout(() => {
      try {
        if (!refTarget.current) {
          processingRef.current = false
          return
        }
        
        // Find target element using coordinate-based detection
        const targetElement = findElementAtOffset(refTarget.current, currentOffset, currentScrollContainer)
        
        // Calculate target coordinates for distance measurement
        let targetX: number, targetY: number
        if (currentScrollContainer?.current) {
          const containerRect = currentScrollContainer.current.getBoundingClientRect()
          const scrollLeft = currentScrollContainer.current.scrollLeft
          const scrollTop = currentScrollContainer.current.scrollTop
          const pixelOffset = convertToPixels(refTarget.current, currentOffset.x, currentOffset.y)
          
          // Calculate coordinates relative to scroll container content
          targetX = containerRect.left + pixelOffset.x - scrollLeft
          targetY = containerRect.top + pixelOffset.y - scrollTop
        } else {
          const containerRect = refTarget.current.getBoundingClientRect()
          const pixelOffset = convertToPixels(refTarget.current, currentOffset.x, currentOffset.y)
          targetX = containerRect.left + pixelOffset.x
          targetY = containerRect.top + pixelOffset.y
        }
        
        // Update children count (count react-attractor registered components recursively)
        let registeredComponentsCount = 0
        
        // Function to recursively check all descendant elements
        const countRegisteredDescendants = (element: HTMLElement) => {
          const tetherInfo = getTether(element)
          if (tetherInfo) {
            registeredComponentsCount++
          }
          
          // Check all child elements recursively
          const children = element.children
          for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child instanceof HTMLElement) {
              countRegisteredDescendants(child)
            }
          }
        }
        
        // Start recursive count from container
        countRegisteredDescendants(refTarget.current)
        
        setChildrenCount(prevCount => {
          if (prevCount !== registeredComponentsCount) {
            return registeredComponentsCount
          }
          return prevCount
        })
        
        let detectedComponent: DetectedComponent
        
        if (!targetElement) {
          // When no child elements are detected at the target coordinates
          detectedComponent = {
            element: undefined,
            component: undefined,
            bounds: undefined,
            distanceFromOffset: 0,
          }
        } else {
          // When a child element is detected
          const bounds = targetElement.getBoundingClientRect()
          const elementCenterX = bounds.left + bounds.width / 2
          const elementCenterY = bounds.top + bounds.height / 2
          
          // Calculate Euclidean distance from target coordinates to element center
          const distanceFromOffset = Math.sqrt(
            Math.pow(elementCenterX - targetX, 2) + 
            Math.pow(elementCenterY - targetY, 2)
          )
          
          detectedComponent = {
            element: targetElement,
            component: getComponentFromElement(targetElement),
            bounds,
            distanceFromOffset,
          }
        }
        
        stableOnDetect(detectedComponent)
      } finally {
        processingRef.current = false
      }
    }, 0)
  }, [stableOnDetect, convertToPixels, refTarget, effectiveScrollContainer, getComponentFromElement, getTether])
  
  // Observer setup for monitoring DOM changes and layout updates
  useEffect(() => {
    if (!refTarget.current || !enabled) {
      return
    }
    
    const targetElement = refTarget.current
    const observers = observersRef.current
    const currentScrollContainer = effectiveScrollContainer?.current
    
    // Clean up existing observers before setting up new ones
    if (observers.mutation) {
      observers.mutation.disconnect()
    }
    if (observers.resize) {
      observers.resize.disconnect()
    }
    if (observers.intersection) {
      observers.intersection.disconnect()
    }
    
    // Create MutationObserver for DOM tree changes
    observers.mutation = new MutationObserver(() => {
      detectComponent()
    })
    
    observers.mutation.observe(targetElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })
    
    // Create ResizeObserver for size changes
    if (window.ResizeObserver) {
      observers.resize = new ResizeObserver(() => {
        detectComponent()
      })
      observers.resize.observe(targetElement)
      
      // Also observe all child elements for size changes
      const childElements = targetElement.querySelectorAll('*')
      childElements.forEach(child => {
        if (child instanceof HTMLElement) {
          observers.resize!.observe(child)
        }
      })
    }
    
    // Setup scroll event listeners for scroll containers
    const handleScroll = () => {
      detectComponent()
    }
    
    if (currentScrollContainer) {
      currentScrollContainer.addEventListener('scroll', handleScroll)
    } else {
      window.addEventListener('scroll', handleScroll)
    }
    
    // Setup resize event listener for window
    const handleResize = () => {
      detectComponent()
    }
    
    window.addEventListener('resize', handleResize)
    
    // Initial detection
    detectComponent()
    
    // Cleanup function
    return () => {
      if (observers.mutation) {
        observers.mutation.disconnect()
      }
      if (observers.resize) {
        observers.resize.disconnect()
      }
      if (observers.intersection) {
        observers.intersection.disconnect()
      }
      
      if (currentScrollContainer) {
        currentScrollContainer.removeEventListener('scroll', handleScroll)
      } else {
        window.removeEventListener('scroll', handleScroll)
      }
      
      window.removeEventListener('resize', handleResize)
    }
  }, [detectComponent, enabled, refTarget, effectiveScrollContainer])
  
  return {
    detected,
    childrenCount,
    isEnabled: enabled,
  }
} 