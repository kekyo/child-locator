import { useCallback, useEffect, useRef, useState } from 'react'
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
  const { offset, onDetect, enabled = true, scrollContainer } = options
  
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const [childrenCount, setChildrenCount] = useState(0)
  
  // Maintain Observer references
  const observersRef = useRef<{
    mutation?: MutationObserver
    resize?: ResizeObserver
    intersection?: IntersectionObserver
  }>({})
  
  // Stably maintain previous detection results
  const lastResultRef = useRef<string>('')
  
  // Detection process execution flag (for debouncing)
  const processingRef = useRef(false)
  
  // Ref to reference current values (to avoid circular dependencies)
  const currentValuesRef = useRef({ offset, enabled, onDetect, scrollContainer })
  currentValuesRef.current = { offset, enabled, onDetect, scrollContainer }
  
  // Function to convert CSS units to px values
  const convertToPixels = useCallback((
    container: HTMLElement,
    x: number | string,
    y: number | string
  ): { x: number; y: number } => {
    // Return as-is if it's a number
    if (typeof x === 'number' && typeof y === 'number') {
      return { x, y }
    }
    
    // For CSS units, use invisible element for conversion
    const manager = new InvisibleElementManager()
    manager.setContainer(container)
    
    try {
      const position = manager.getPositionFromCSSUnits(x, y)
      return position || { x: 0, y: 0 }
    } finally {
      manager.cleanup()
    }
  }, [])

  // Stabilize onDetect callback
  const stableOnDetect = useCallback((component: DetectedComponent) => {
    // Hash the result to detect changes
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
  
  // Stabilize detection process (avoid useCallback circular dependencies)
  const detectComponent = useCallback(() => {
    const { offset: currentOffset, enabled: currentEnabled, scrollContainer: currentScrollContainer } = currentValuesRef.current
    
    if (processingRef.current || !refTarget.current || !currentEnabled) {
      return
    }
    
    processingRef.current = true
    
    // Execute in next event loop (avoid React re-rendering cycle)
    setTimeout(() => {
      try {
        if (!refTarget.current) {
          processingRef.current = false
          return
        }
        
        const targetElement = findElementAtOffset(refTarget.current, currentOffset, currentScrollContainer)
        
        // Calculate target coordinates considering scroll container
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
        
        // Get visible child element count excluding invisible elements
        const childrenCount = InvisibleElementManager.getVisibleChildren(refTarget.current).length
        
        // Update children count
        setChildrenCount(prevCount => {
          if (prevCount !== childrenCount) {
            return childrenCount
          }
          return prevCount
        })
        
        let detectedComponent: DetectedComponent
        
        if (!targetElement) {
          // When no child elements exist
          detectedComponent = {
            element: undefined,
            component: undefined,
            bounds: undefined,
            distanceFromOffset: 0,
          }
        } else {
          // When child elements exist
          const bounds = targetElement.getBoundingClientRect()
          const elementCenterX = bounds.left + bounds.width / 2
          const elementCenterY = bounds.top + bounds.height / 2
          
          // Calculate distance from target coordinates (Euclidean distance)
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
  }, [stableOnDetect, convertToPixels, refTarget])
  
  // Observer setup
  useEffect(() => {
    if (!refTarget.current || !enabled) {
      return
    }
    
    const targetElement = refTarget.current
    const observers = observersRef.current
    
    // Clean up existing Observers
    observers.mutation?.disconnect()
    observers.resize?.disconnect()
    observers.intersection?.disconnect()
    
    // MutationObserver
    observers.mutation = new MutationObserver(() => {
      detectComponent()
    })
    observers.mutation.observe(targetElement, {
      childList: true,
      subtree: false,
    })
    
    // ResizeObserver
    observers.resize = new ResizeObserver((entries) => {
      // Process only when size actually changes
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        
        if (width > 0 && height > 0) {
          detectComponent()
          break
        }
      }
    })
    observers.resize.observe(targetElement)
    
    // IntersectionObserver
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
    
    // Cleanup
    return () => {
      observers.mutation?.disconnect()
      observers.resize?.disconnect()
      observers.intersection?.disconnect()
    }
  }, [enabled, detectComponent, refTarget])
  
  // Handle offset changes
  useEffect(() => {
    if (enabled) {
      // Reset previous results
      lastResultRef.current = ''
      detectComponent()
    }
  }, [offset.x, offset.y, enabled, detectComponent])
  
  // Monitor scroll events (both window and container)
  useEffect(() => {
    if (!enabled || !refTarget.current) return
    
    let timeoutId: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        detectComponent()
      }, 150)
    }
    
    const targetElement = refTarget.current
    const currentScrollContainer = scrollContainer?.current
    const scrollElement = currentScrollContainer || targetElement
    
    // Window scroll events (only if no scroll container is specified)
    if (!currentScrollContainer) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
    
    // Container scroll events (use scrollContainer if specified, otherwise use target element)
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
  }, [enabled, scrollContainer, detectComponent, refTarget])
  
  // Handle resize events
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