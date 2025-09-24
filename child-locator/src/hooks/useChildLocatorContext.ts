// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import { useTetherContext } from 'react-attractor';

/**
 * Internal hook for accessing child locator context
 * This wraps react-attractor's useTetherContext to hide the implementation details
 * @internal
 */
export const useChildLocatorContext = () => {
  return useTetherContext();
};
