import { useTetherContext } from 'react-attractor';

/**
 * Internal hook for accessing child locator context
 * This wraps react-attractor's useTetherContext to hide the implementation details
 * @internal
 */
export const useChildLocatorContext = () => {
  return useTetherContext();
};
