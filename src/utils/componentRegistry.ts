import type { ReactElement } from 'react'
import type { OffsetCoordinates } from '../types/useLocator'

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
 * Find the child element closest to the specified XY coordinates
 * @param container - Container element to search within
 * @param offset - Target offset coordinates for detection
 * @returns Closest child element, or null if not found
 */
export const findElementAtOffset = (
  container: HTMLElement,
  offset: OffsetCoordinates
): HTMLElement | null => {
  const containerRect = container.getBoundingClientRect()
  const targetX = containerRect.left + offset.x
  const targetY = containerRect.top + offset.y
  
  let closestElement: HTMLElement | null = null
  let closestDistance = Infinity
  
  // Target only direct children of the container
  const children = Array.from(container.children) as HTMLElement[]
  
  for (const child of children) {
    const childRect = child.getBoundingClientRect()
    
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
      closestElement = child
    }
  }
  
  return closestElement
}

/**
 * Element detection at specified XY coordinates (with more detailed information)
 * @param container - Container element to search within
 * @param offset - Target offset coordinates for detection
 * @returns Detailed information about detection results
 */
export const detectElementAtOffset = (
  container: HTMLElement,
  offset: OffsetCoordinates
): {
  element: HTMLElement | null
  distance: number
  targetCoordinates: { x: number; y: number }
} => {
  const containerRect = container.getBoundingClientRect()
  const targetX = containerRect.left + offset.x
  const targetY = containerRect.top + offset.y
  
  const element = findElementAtOffset(container, offset)
  
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