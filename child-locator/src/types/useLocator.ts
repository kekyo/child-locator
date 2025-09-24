import type { ReactElement, RefObject } from 'react';

/**
 * CSS unit value type that supports both numeric (px) and string (%, vw, vh, rem, em) values
 * Similar to React.CSSProperties values but specifically for coordinate positioning
 */
export type CSSUnitValue = number | string;

/**
 * Metadata that can be associated with child components for tracking
 */
export interface ChildLocatorMetadata {
  [key: string]: unknown;
}

/**
 * Information about the detected child component
 */
export interface DetectedComponent {
  /** Detected HTML element */
  element?: HTMLElement;
  /** Detected React component */
  component?: ReactElement;
  /** Element's bounding information */
  bounds?: DOMRect;
  /** Distance from the specified offset coordinates */
  distanceFromOffset: number;
}

/**
 * Offset coordinates with CSS unit support
 */
export interface OffsetCoordinates {
  /** X coordinate - supports px (number), %, vw, vh, rem, em (string) */
  x: CSSUnitValue;
  /** Y coordinate - supports px (number), %, vw, vh, rem, em (string) */
  y: CSSUnitValue;
}

/**
 * Options for useLocator hook
 */
export interface UseLocatorOptions {
  /** Target offset coordinates for detection */
  offset: OffsetCoordinates;
  /** Callback for detection results */
  onDetect: (detected: DetectedComponent) => void;
  /** Enable/disable monitoring */
  enabled?: boolean;
  /** Optional scroll container reference for scroll-container-relative coordinate calculation */
  scrollContainerRef?: RefObject<HTMLElement | null>;
}
