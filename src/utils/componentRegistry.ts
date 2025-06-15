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
 * Find the child element closest to the specified XY coordinates
 * @param container - Container element to search within
 * @param offset - Target offset coordinates for detection
 * @param scrollContainer - Optional scroll container for scroll-relative coordinate calculation
 * @returns Closest child element, or null if not found
 */
export const findElementAtOffset = (
  container: HTMLElement,
  offset: OffsetCoordinates,
  scrollContainer?: RefObject<HTMLElement | null>
): HTMLElement | null => {
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
  
  let closestElement: HTMLElement | null = null
  let closestDistance = Infinity
  
  // Exclude invisible elements and target only direct child elements
  const children = InvisibleElementManager.getVisibleChildren(container)
  
  for (const child of children) {
    const childRect = (child as HTMLElement).getBoundingClientRect()
    
    // Calculate element center coordinates
    const elementCenterX = childRect.left + childRect.width / 2
    const elementCenterY = childRect.top + childRect.height / 2
    
    // Calculate distance from target coordinates (Euclidean distance)
    const distance = Math.sqrt(
      Math.pow(elementCenterX - targetX, 2) + 
      Math.pow(elementCenterY - targetY, 2)
    )
    
    // Update if a closer element is found
    if (distance < closestDistance) {
      closestDistance = distance
      closestElement = child as HTMLElement
    }
  }
  
  return closestElement
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