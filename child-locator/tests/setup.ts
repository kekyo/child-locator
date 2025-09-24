import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(
  () => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
  })
)

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(
  () => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  })
)

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn((): DOMRect => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: () => ({})
}))

// Mock document.elementFromPoint
document.elementFromPoint = vi.fn((): Element | null => {
  // Return the first child element found in the document for testing
  const container = document.querySelector('[data-testid="container"]')
  if (container && container.children.length > 0) {
    return container.children[0]
  }
  return null
})

// Cleanup after each test case
afterEach(() => {
  cleanup()
})
