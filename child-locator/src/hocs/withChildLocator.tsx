// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import { isForwardRefComponent, withTether } from 'react-attractor';
import type {
  LocatorCompatibleComponent,
  WithChildLocatorProps,
} from '../types';
import type { ComponentType, CSSProperties, PropsWithoutRef } from 'react';
import { forwardRef } from 'react';

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

type ComponentPropsWithoutRef<C extends ComponentType<any>> = PropsWithoutRef<
  ComponentProps<C>
>;

// Wrapper element acts as tether anchor without altering surrounding layout.
const LOCATOR_WRAPPER_STYLE: CSSProperties = { display: 'contents' };

const createFallbackWrapper = <C extends ComponentType<any>>(Component: C) => {
  const Fallback = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<C>>(
    (props, ref) => (
      <div
        ref={ref}
        style={LOCATOR_WRAPPER_STYLE}
        data-child-locator-wrapper=""
      >
        <Component {...(props as ComponentProps<C>)} />
      </div>
    )
  );

  const componentName = Component.displayName ?? Component.name ?? 'Component';
  Fallback.displayName = `ChildLocatorWrapper(${componentName})`;

  return Fallback;
};

export function withChildLocator<C extends ComponentType<any>>(
  Component: LocatorCompatibleComponent<C>
): ComponentType<ComponentProps<C> & WithChildLocatorProps>;

export function withChildLocator<C extends ComponentType<any>>(
  Component: C
): ComponentType<ComponentProps<C> & WithChildLocatorProps>;

export function withChildLocator<C extends ComponentType<any>>(
  Component: C
): ComponentType<ComponentProps<C> & WithChildLocatorProps> {
  const baseComponent = isForwardRefComponent(Component)
    ? (Component as ComponentType<ComponentProps<C>>)
    : (createFallbackWrapper(Component) as ComponentType<ComponentProps<C>>);

  return withTether(baseComponent) as ComponentType<
    ComponentProps<C> & WithChildLocatorProps
  >;
}
