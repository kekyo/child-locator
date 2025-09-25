// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import React from 'react';
import { withTether } from 'react-attractor';
import type { WithChildLocatorProps } from '../types';

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
  return withTether(Component);
};
