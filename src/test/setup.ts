import '@testing-library/jest-dom'

// ResizeObserver polyfill for tests
class MockResizeObserver {
  constructor(_callback: any) {
    // Mock implementation
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// IntersectionObserver polyfill for tests
class MockIntersectionObserver {
  constructor(_callback: any, _options?: any) {
    // Mock implementation
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// MutationObserver polyfill for tests
class MockMutationObserver {
  constructor(_callback: any) {
    // Mock implementation
  }
  observe() {}
  disconnect() {}
}

// Set globally
(globalThis as any).ResizeObserver = MockResizeObserver;
(globalThis as any).IntersectionObserver = MockIntersectionObserver;
(globalThis as any).MutationObserver = MockMutationObserver; 