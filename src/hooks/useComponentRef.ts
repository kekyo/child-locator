import { useCallback, useRef } from 'react'
import type { ReactElement } from 'react'
import { registerComponent, unregisterComponent } from '../utils/componentRegistry'

/**
 * Custom Ref Hook for associating HTMLElement with React component
 */
export const useComponentRef = <T extends HTMLElement>(component?: ReactElement) => {
  const elementRef = useRef<T | null>(null)
  
  const setRef = useCallback((element: T | null) => {
    // Unregister previous element
    if (elementRef.current) {
      unregisterComponent(elementRef.current)
    }
    
    // Register new element
    if (element && component) {
      registerComponent(element, component)
    }
    
    elementRef.current = element
  }, [component])
  
  return [elementRef, setRef] as const
} 