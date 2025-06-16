// Main implementation using react-attractor
export { useTetheredLocator as useLocator } from './hooks/useTetheredLocator'

// Re-export react-attractor components for user convenience
export { TetherProvider, useTetherContext, withTether } from 'react-attractor'

// Types
export type {
  DetectedComponent,
  OffsetCoordinates,
  UseLocatorOptions,
  UseLocatorReturn,
} from './types/useLocator'