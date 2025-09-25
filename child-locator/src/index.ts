// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

// Types
export type {
  CSSUnitValue,
  DetectedComponent,
  OffsetCoordinates,
  UseLocatorOptions,
  ChildLocatorMetadata,
  ChildLocatorProviderProps,
  WithChildLocatorProps,
} from './types';

// Main child-locator API
export { useLocator } from './hooks/useLocator';

// Child-locator specific provider and HOC
export { ChildLocatorProvider } from './providers/ChildLocatorProvider';
export { withChildLocator } from './hocs/withChildLocator';
