// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

// Main child-locator API
export { useLocator } from './hooks/useLocator';

// Child-locator specific provider and HOC
export { ChildLocatorProvider } from './providers/ChildLocatorProvider';
export { withChildLocator } from './hocs/withChildLocator';

// Types
export type {
  DetectedComponent,
  OffsetCoordinates,
  UseLocatorOptions,
  ChildLocatorMetadata,
} from './types/useLocator';

export type { WithChildLocatorProps } from './hocs/withChildLocator';
export type { ChildLocatorProviderProps } from './providers/ChildLocatorProvider';
