import type { ReactElement, RefObject } from 'react'
import type { OffsetCoordinates } from '../types/useLocator'
import { InvisibleElementManager } from './invisibleElementManager'

/**
 * WeakMap that manages associations between HTMLElement and React components
 */
const elementToComponentMap = new WeakMap<HTMLElement, ReactElement>()

/**
 * Associate a React component with an HTMLElement
 */
export const registerComponent = (element: HTMLElement, component: ReactElement): void => {
  elementToComponentMap.set(element, component)
}

/**
 * Get the associated React component from an HTMLElement
 */
export const getComponentFromElement = (element: HTMLElement): ReactElement | undefined => {
  return elementToComponentMap.get(element)
}

/**
 * Remove the association between HTMLElement and React component
 */
export const unregisterComponent = (element: HTMLElement): void => {
  elementToComponentMap.delete(element)
}

/**
 * Convert CSS units to px values
 */
const convertToPixels = (
  container: HTMLElement,
  offset: OffsetCoordinates
): { x: number; y: number } => {
  // Return as-is if both are numbers
  if (typeof offset.x === 'number' && typeof offset.y === 'number') {
    return { x: offset.x, y: offset.y }
  }

  // For CSS units, use invisible element for conversion
  const manager = new InvisibleElementManager()
  manager.setContainer(container)
  
  try {
    const position = manager.getPositionFromCSSUnits(offset.x, offset.y)
    return position || { x: 0, y: 0 }
  } finally {
    manager.cleanup()
  }
}

/**
 * Fallback element detection using getBoundingClientRect when document.elementFromPoint fails
 * This method checks all direct children and finds the best match based on coordinate bounds and distance
 */
const findElementByBounds = (
  container: HTMLElement,
  targetX: number,
  targetY: number
): HTMLElement | null => {
  // Get all visible direct children (excluding invisible locator elements)
  const children = InvisibleElementManager.getVisibleChildren(container)
  
  const candidates: Array<{
    element: HTMLElement
    distance: number
    bounds: DOMRect
  }> = []
  
  // Check each child element's bounds
  children.forEach(child => {
    const rect = child.getBoundingClientRect()
    
    // Check if target coordinates are within element bounds
    const isWithinBounds = 
      targetX >= rect.left && targetX <= rect.right &&
      targetY >= rect.top && targetY <= rect.bottom
    
    if (isWithinBounds) {
      // Calculate distance from target to element center
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
  
  // Return the closest element if any candidates found
  if (candidates.length > 0) {
    // Sort by distance (closest first), then by DOM order for ties
    candidates.sort((a, b) => {
      const distanceDiff = a.distance - b.distance
      if (Math.abs(distanceDiff) < 0.1) {
        // If distances are very close, prefer later DOM order (similar to stacking context behavior)
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
 * Find element at specified offset coordinates
 * Uses document.elementFromPoint for viewport coordinates, falls back to bounds checking for out-of-viewport coordinates
 */
export function findElementAtOffset(
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
      // This respects stacking context and z-index properly
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
    // Note: Detection results may differ from viewport-based detection for overlapping elements
    // due to different selection criteria (distance vs stacking context)
    if (!element) {
      return findElementByBounds(container, targetX, targetY)
    }
    
    return null
  } finally {
    manager.cleanup()
  }
}

/**
 * Element detection at specified XY coordinates (with more detailed information)
 * @param container - Container element to search within
 * @param offset - Target offset coordinates for detection
 * @param scrollContainer - Optional scroll container for scroll-relative coordinate calculation
 * @returns Detailed information about detection results
 */
export const detectElementAtOffset = (
  container: HTMLElement,
  offset: OffsetCoordinates,
  scrollContainer?: RefObject<HTMLElement | null>
): {
  element: HTMLElement | null
  distance: number
  targetCoordinates: { x: number; y: number }
} => {
  const pixelOffset = convertToPixels(container, offset)
  
  let targetX: number, targetY: number
  if (scrollContainer?.current) {
    const scrollContainerRect = scrollContainer.current.getBoundingClientRect()
    const scrollLeft = scrollContainer.current.scrollLeft
    const scrollTop = scrollContainer.current.scrollTop
    
    // Calculate coordinates relative to scroll container content
    targetX = scrollContainerRect.left + pixelOffset.x - scrollLeft
    targetY = scrollContainerRect.top + pixelOffset.y - scrollTop
  } else {
    const containerRect = container.getBoundingClientRect()
    targetX = containerRect.left + pixelOffset.x
    targetY = containerRect.top + pixelOffset.y
  }
  
  const element = findElementAtOffset(container, offset, scrollContainer)
  
  let distance = 0
  if (element) {
    const elementRect = element.getBoundingClientRect()
    const elementCenterX = elementRect.left + elementRect.width / 2
    const elementCenterY = elementRect.top + elementRect.height / 2
    
    distance = Math.sqrt(
      Math.pow(elementCenterX - targetX, 2) + 
      Math.pow(elementCenterY - targetY, 2)
    )
  }
  
  return {
    element,
    distance,
    targetCoordinates: { x: targetX, y: targetY }
  }
} 