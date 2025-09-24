import React from 'react'
import { withTether } from 'react-attractor'
import type { ChildLocatorMetadata } from '../types/useLocator'

/**
 * Props automatically injected by withChildLocator
 */
export interface WithChildLocatorProps {
  /** Metadata for tracking this component */
  tetherMetadata?: ChildLocatorMetadata
}

/**
 * Higher-Order Component that enables a component to be tracked by child-locator
 * 
 * @param Component - The component to wrap
 * @returns A wrapped component that can be detected by useLocator
 * 
 * @example
 * ```tsx
 * const BaseItem = ({ children }) => <div>{children}</div>
 * const TrackableItem = withChildLocator(BaseItem)
 * 
 * // Usage
 * <TrackableItem tetherMetadata={{ id: 'item-1', type: 'grid-item' }}>
 *   Content
 * </TrackableItem>
 * ```
 */
export const withChildLocator = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & WithChildLocatorProps> => {
  return withTether(Component)
} 