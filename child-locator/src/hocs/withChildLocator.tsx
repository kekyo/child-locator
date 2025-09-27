// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import { withTether } from 'react-attractor';
import type {
  LocatorCompatibleComponent,
  WithChildLocatorProps,
} from '../types';
import type { ComponentType } from 'react';

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
type ComponentProps<C extends ComponentType<any>> =
  C extends ComponentType<infer P> ? P : never;

export const withChildLocator = <C extends ComponentType<any>>(
  Component: LocatorCompatibleComponent<C>
): ComponentType<ComponentProps<C> & WithChildLocatorProps> => {
  return withTether(
    Component as ComponentType<ComponentProps<C>>
  ) as ComponentType<ComponentProps<C> & WithChildLocatorProps>;
};
