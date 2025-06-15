import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import type { RefObject } from 'react'
import type { DetectedComponent, UseLocatorOptions, UseLocatorReturn } from '../types/useLocator'
import { findElementAtOffset, getComponentFromElement } from '../utils/componentRegistry'
import { InvisibleElementManager } from '../utils/invisibleElementManager'

/**
 * A Hook that monitors child components of a specified component and
 * identifies child components at XY coordinate offset positions
 */
export const useLocator = (
  refTarget: RefObject<HTMLElement | null>,
  options: UseLocatorOptions
): UseLocatorReturn => {
  const { offset, onDetect, enabled = true, scrollContainerRef } = options
  
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const [childrenCount, setChildrenCount] = useState(0)
  
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
        
        // Update children count (excluding invisible locator elements)
        const childrenCount = InvisibleElementManager.getVisibleChildren(refTarget.current).length
        
        setChildrenCount(prevCount => {
          if (prevCount !== childrenCount) {
            return childrenCount
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
  }, [stableOnDetect, convertToPixels, refTarget, effectiveScrollContainer])
  
  // Observer setup for monitoring DOM changes and layout updates
  useEffect(() => {
    if (!refTarget.current || !enabled) {
      return
    }
    
    const targetElement = refTarget.current
    const observers = observersRef.current
    
    // Clean up existing observers before setting up new ones
    observers.mutation?.disconnect()
    observers.resize?.disconnect()
    observers.intersection?.disconnect()
    
    // MutationObserver: Monitor child element changes
    observers.mutation = new MutationObserver(() => {
      detectComponent()
    })
    observers.mutation.observe(targetElement, {
      childList: true,
      subtree: false, // Only monitor direct children
    })
    
    // ResizeObserver: Monitor container size changes
    observers.resize = new ResizeObserver((entries) => {
      // Process only when size actually changes to avoid unnecessary calls
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        
        if (width > 0 && height > 0) {
          detectComponent()
          break
        }
      }
    })
    observers.resize.observe(targetElement)
    
    // IntersectionObserver: Monitor visibility changes
    observers.intersection = new IntersectionObserver(() => {
      detectComponent()
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0,
    })
    observers.intersection.observe(targetElement)
    
    // Initial detection
    detectComponent()
    
    // Cleanup function
    return () => {
      observers.mutation?.disconnect()
      observers.resize?.disconnect()
      observers.intersection?.disconnect()
    }
  }, [enabled, detectComponent, refTarget])
  
  // Handle offset changes with immediate re-detection
  useEffect(() => {
    if (enabled) {
      detectComponent()
    }
  }, [offset, enabled, detectComponent])
  
  // Monitor scroll events with throttling for performance
  useEffect(() => {
    if (!enabled || !refTarget.current) return
    
    let timeoutId: NodeJS.Timeout | null = null
    
    // Throttled scroll handler to avoid excessive detection calls
    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        detectComponent()
      }, 150) // 150ms throttle
    }
    
    const targetElement = refTarget.current
    const currentScrollContainer = effectiveScrollContainer?.current
    const scrollElement = currentScrollContainer || targetElement
    
    // Window scroll events (only if no scroll container is specified)
    if (!currentScrollContainer) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
    
    // Container scroll events
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      if (!currentScrollContainer) {
        window.removeEventListener('scroll', handleScroll)
      }
      scrollElement.removeEventListener('scroll', handleScroll)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [enabled, scrollContainerRef, detectComponent, refTarget, effectiveScrollContainer])
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      detectComponent()
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [detectComponent])
  
  return {
    detected,
    childrenCount,
    isEnabled: enabled,
  }
} 