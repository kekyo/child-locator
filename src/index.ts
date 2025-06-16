// Main implementation using react-attractor
export { useLocator } from './hooks/useLocator'

// Re-export react-attractor components for user convenience
export { TetherProvider, useTetherContext, withTether } from 'react-attractor'

// Types
export type {
  DetectedComponent,
  OffsetCoordinates,
  UseLocatorOptions,
} from './types/useLocator'