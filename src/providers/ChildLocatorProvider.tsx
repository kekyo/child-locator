import React from 'react'
import { TetherProvider } from 'react-attractor'

/**
 * Provider component for child-locator functionality
 * This wraps react-attractor's TetherProvider to provide a child-locator specific API
 */
export interface ChildLocatorProviderProps {
  children: React.ReactNode
}

/**
 * Provider that enables child component location tracking
 * Must be placed at the root of your component tree to use child-locator hooks
 */
export const ChildLocatorProvider: React.FC<ChildLocatorProviderProps> = ({ children }: ChildLocatorProviderProps) => {
  return <TetherProvider>{children}</TetherProvider>
} 