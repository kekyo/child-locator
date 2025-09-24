// Main child-locator API
export { useLocator } from './hooks/useLocator'

// Child-locator specific provider and HOC
export { ChildLocatorProvider } from './providers/ChildLocatorProvider'
export { withChildLocator } from './hocs/withChildLocator'

// Types
export type {
  DetectedComponent,
  OffsetCoordinates,
  UseLocatorOptions,
  ChildLocatorMetadata,
} from './types/useLocator'

export type { WithChildLocatorProps } from './hocs/withChildLocator'
export type { ChildLocatorProviderProps } from './providers/ChildLocatorProvider'