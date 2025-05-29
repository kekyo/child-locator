// Hooks
export { useLocator } from './hooks/useLocator'
export { useComponentRef } from './hooks/useComponentRef'

// Types
export type {
  DetectedComponent,
  OffsetCoordinates,
  UseLocatorOptions,
  UseLocatorReturn,
} from './types/useLocator'

// Utils
export {
  registerComponent,
  getComponentFromElement,
  unregisterComponent,
  findElementAtOffset,
} from './utils/componentRegistry' 