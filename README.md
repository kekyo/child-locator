# child-locator

[![Project Status: Concept – Minimal or no implementation has been done yet, or the repository is only intended to be a limited example, demo, or proof-of-concept.](https://www.repostatus.org/badges/latest/concept.svg)](https://www.repostatus.org/#concept)

A React Hook for detecting child components at specific XY coordinates within a container element.

## Features

- **XY Coordinate Detection**: Precisely locate child components at specified coordinates
- **Real-time Monitoring**: Automatically detects changes in child elements using MutationObserver, ResizeObserver, and IntersectionObserver
- **Distance Calculation**: Provides Euclidean distance from target coordinates to detected elements
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **React Component Mapping**: Maps HTML elements back to their React components using WeakMap
- **Performance Optimized**: Efficient observer management with proper cleanup

## Installation

```bash
npm install child-locator
```

## Basic Usage

```tsx
import React, { useRef } from 'react'
import { useLocator, useComponentRef } from 'child-locator'
import type { DetectedComponent } from 'child-locator'

// Child component with component registration
const ChildItem = ({ id }: { id: number }) => {
  const component = <ChildItem id={id} />
  const [, setRef] = useComponentRef<HTMLDivElement>(component)
  
  return (
    <div ref={setRef} data-testid={`child-${id}`}>
      Child {id}
    </div>
  )
}

// Parent component using useLocator
const ParentComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { detected, childrenCount, isEnabled } = useLocator(containerRef, {
    offset: { x: 100, y: 150 }, // Target coordinates
    onDetect: (component: DetectedComponent) => {
      if (component.element) {
        console.log('Detected element:', component.element)
        console.log('Distance from target:', component.distanceFromOffset)
        console.log('React component:', component.component)
      } else {
        console.log('No child elements at target coordinates')
      }
    },
    enabled: true
  })
  
  return (
    <div ref={containerRef} style={{ width: 400, height: 300 }}>
      <ChildItem id={1} />
      <ChildItem id={2} />
      <ChildItem id={3} />
    </div>
  )
}
```

## API Reference

### useLocator Hook

```tsx
const { detected, childrenCount, isEnabled } = useLocator(refTarget, options)
```

#### Parameters

- `refTarget: RefObject<HTMLElement | null>` - Reference to the container element
- `options: UseLocatorOptions` - Configuration options

#### UseLocatorOptions

```tsx
interface UseLocatorOptions {
  offset: OffsetCoordinates      // Target XY coordinates
  onDetect: (detected: DetectedComponent) => void  // Detection callback
  enabled?: boolean              // Enable/disable monitoring (default: true)
}
```

#### OffsetCoordinates

```tsx
interface OffsetCoordinates {
  x: number  // X offset from container's left edge (pixels)
  y: number  // Y offset from container's top edge (pixels)
}
```

#### Return Value

```tsx
interface UseLocatorReturn {
  detected: DetectedComponent | null  // Currently detected component
  childrenCount: number              // Number of child elements
  isEnabled: boolean                 // Whether monitoring is active
}
```

#### DetectedComponent

```tsx
interface DetectedComponent {
  element?: HTMLElement     // Detected HTML element (undefined if no children)
  component?: ReactElement  // Associated React component
  bounds?: DOMRect         // Element's bounding rectangle
  distanceFromOffset: number // Euclidean distance from target coordinates
}
```

### useComponentRef Hook

```tsx
const [ref, setRef] = useComponentRef<T>(component)
```

Registers a React component with its corresponding HTML element for reverse lookup.

#### Parameters

- `component: ReactElement` - The React component to register

#### Return Value

- `[RefObject<T>, (element: T | null) => void]` - Ref object and setter function

## Advanced Usage

### Grid Layout Detection

```tsx
const GridComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [targetCoords, setTargetCoords] = useState({ x: 100, y: 100 })
  
  const { detected } = useLocator(containerRef, {
    offset: targetCoords,
    onDetect: (component) => {
      if (component.element) {
        const itemId = component.element.getAttribute('data-item-id')
        console.log(`Detected grid item: ${itemId}`)
        console.log(`Distance: ${component.distanceFromOffset.toFixed(1)}px`)
      }
    }
  })
  
  return (
    <div>
      <div>
        <label>
          X: <input 
            type="range" 
            min="0" 
            max="400" 
            value={targetCoords.x}
            onChange={(e) => setTargetCoords(prev => ({ ...prev, x: +e.target.value }))}
          />
        </label>
        <label>
          Y: <input 
            type="range" 
            min="0" 
            max="300" 
            value={targetCoords.y}
            onChange={(e) => setTargetCoords(prev => ({ ...prev, y: +e.target.value }))}
          />
        </label>
      </div>
      
      <div 
        ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          width: '400px',
          height: '300px'
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <GridItem key={i} id={i + 1} />
        ))}
      </div>
    </div>
  )
}
```

## Important Notes

### Performance Considerations

- The hook uses multiple observers (MutationObserver, ResizeObserver, IntersectionObserver) for comprehensive monitoring
- Detection callbacks are debounced to prevent excessive calls
- Observers are automatically cleaned up when the component unmounts or when disabled

### Coordinate System

- Coordinates are relative to the container element's top-left corner
- The coordinate system follows standard web conventions (0,0 at top-left)
- Coordinates outside the container bounds will detect the closest child element

### Component Registration

- Use `useComponentRef` to enable React component detection
- Components are stored using WeakMap for automatic garbage collection
- Registration is optional; the hook works with HTML elements alone

### Browser Compatibility

- Requires modern browsers with support for:
  - MutationObserver
  - ResizeObserver
  - IntersectionObserver
  - WeakMap

### Memory Management

- All observers are automatically disconnected on cleanup
- WeakMap ensures no memory leaks from component registration
- Refs are properly cleaned up when components unmount

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for production
npm run build

# Run linting
npm run lint
```

## Testing

The project includes comprehensive test suites:

- **Unit Tests**: vitest with @testing-library/react
- **Integration Tests**: Playwright for end-to-end testing

```bash
# Run unit tests
npm test

# Run Playwright tests
npx playwright test
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## Changelog

### 0.1.0
- Initial release with XY coordinate detection
- React component mapping support
- Comprehensive observer-based monitoring
- TypeScript support with full type definitions
