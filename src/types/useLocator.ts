import type { ReactElement } from 'react'

/**
 * Information about the detected child component
 */
export interface DetectedComponent {
  /** Detected HTML element */
  element?: HTMLElement
  /** Detected React component */
  component?: ReactElement
  /** Element's bounding information */
  bounds?: DOMRect
  /** Distance from the specified offset coordinates */
  distanceFromOffset: number
}

/**
 * Offset coordinates
 */
export interface OffsetCoordinates {
  /** X-axis offset (pixels from container's left edge) */
  x: number
  /** Y-axis offset (pixels from container's top edge) */
  y: number
}

/**
 * Options for useLocator hook
 */
export interface UseLocatorOptions {
  /** Target offset coordinates for detection */
  offset: OffsetCoordinates
  /** Callback for detection results */
  onDetect: (detected: DetectedComponent) => void
  /** Enable/disable monitoring */
  enabled?: boolean
}

/**
 * Return value of useLocator hook
 */
export interface UseLocatorReturn {
  /** Currently detected component */
  detected: DetectedComponent | null
  /** Number of child elements */
  childrenCount: number
  /** Whether monitoring is enabled */
  isEnabled: boolean
} 