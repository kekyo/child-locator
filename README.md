# child-locator

A React Hook for detecting child components at specific XY coordinates within a container element.

[![NPM child-locator](https://img.shields.io/npm/v/child-locator)](https://www.npmjs.com/package/child-locator)
[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

## Features

- XY Coordinate Detection: Precisely locate child components at specified coordinates
- CSS Unit Support: Coordinate values support px (number), %, vw, vh, rem, em (string) units
- Real-time Monitoring: Automatically detects changes in child elements using MutationObserver, ResizeObserver, and IntersectionObserver
- Distance Calculation: Provides Euclidean distance from target coordinates to detected elements
- TypeScript Support: Full TypeScript support with comprehensive type definitions
- React Component Mapping: Maps HTML elements back to their React components using WeakMap
- Performance Optimized: Efficient observer management with proper cleanup

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
    offset: { x: '50%', y: '30%' }, // CSS units supported: px, %, vw, vh, rem, em
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
  offset: OffsetCoordinates;      // Target XY coordinates
  onDetect: (detected: DetectedComponent) => void;  // Detection callback
  enabled?: boolean;              // Enable/disable monitoring (default: true)
  scrollContainerRef?: RefObject<HTMLElement | null>; // Optional scroll container
}
```

#### OffsetCoordinates

```tsx
interface OffsetCoordinates {
  x: CSSUnitValue;  // X coordinate - supports px (number), %, vw, vh, rem, em (string)
  y: CSSUnitValue;  // Y coordinate - supports px (number), %, vw, vh, rem, em (string)
}

type CSSUnitValue = number | string;
```

#### Return Value

```tsx
interface UseLocatorReturn {
  detected: DetectedComponent | null;  // Currently detected component
  childrenCount: number;               // Number of child elements
  isEnabled: boolean;                  // Whether monitoring is active
}
```

#### DetectedComponent

```tsx
interface DetectedComponent {
  element?: HTMLElement;      // Detected HTML element (undefined if no children)
  component?: ReactElement;   // Associated React component
  bounds?: DOMRect;           // Element's bounding rectangle
  distanceFromOffset: number; // Euclidean distance from target coordinates
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

### CSS Unit Support Examples

```tsx
const CoordinateExamples: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coordinateType, setCoordinateType] = useState<string>('percentage');
  
  // Different coordinate examples
  const coordinateExamples = {
    percentage: { x: '50%', y: '25%' },
    viewport: { x: '10vw', y: '15vh' },
    relative: { x: '5rem', y: '3em' },
    pixels: { x: 200, y: 150 }
  };
  
  const { detected } = useLocator(containerRef, {
    offset: coordinateExamples[coordinateType as keyof typeof coordinateExamples],
    onDetect: (component) => {
      if (component.element) {
        console.log(`Detected at ${coordinateType}:`, component.element)
      }
    }
  })
  
  return (
    <div>
      <div>
        <h3>CSS Unit Examples</h3>
        <label>
          Coordinate Type:
          <select 
            value={coordinateType} 
            onChange={(e) => setCoordinateType(e.target.value)}>
            <option value="percentage">Percentage (50%, 25%)</option>
            <option value="viewport">Viewport (10vw, 15vh)</option>
            <option value="relative">Relative (5rem, 3em)</option>
            <option value="pixels">Pixels (200px, 150px)</option>
          </select>
        </label>
      </div>
      
      <div 
        ref={containerRef}
        style={{
          width: '600px',
          height: '400px',
          border: '2px solid #333',
          position: 'relative'
        }}>
        {/* Your child components here */}
      </div>
    </div>
  )
}
```

### Grid Layout Detection

```tsx
const GridComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [targetCoords, setTargetCoords] = useState({ x: '25%', y: '50%' });
  
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
          X (CSS Unit): <input 
            type="text" 
            value={targetCoords.x}
            placeholder="e.g., 50%, 200px, 10vw"
            onChange={(e) => setTargetCoords(prev => ({ ...prev, x: e.target.value }))} />
        </label>
        <label>
          Y (CSS Unit): <input 
            type="text" 
            value={targetCoords.y}
            placeholder="e.g., 30%, 150px, 5vh"
            onChange={(e) => setTargetCoords(prev => ({ ...prev, y: e.target.value }))} />
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

### Coordinate System

- Flexible Units: Supports multiple CSS unit types:
  - Pixels (number): Direct pixel values (e.g., `100`, `250`)
  - Percentages (string): Relative to container size (e.g., `'50%'`, `'25%'`)
  - Viewport units (string): Relative to viewport (e.g., `'10vw'`, `'15vh'`)
  - Font-relative units (string): `'rem'` (root) and `'em'` (element) units
- Container-relative: Coordinates are relative to the container element's content area (excluding padding)
- Standard conventions: Follows web coordinate system (0,0 at top-left)
- Automatic conversion: CSS units are converted to pixels internally for precise detection
- Responsive design: Percentage and viewport units automatically adapt to size changes

### Component Registration

- Use `useComponentRef` to enable React component detection
- Components are stored using WeakMap for automatic garbage collection
- Registration is optional; the hook works with HTML elements alone

### Limitations

- Direct Children Only: The child-locator can only detect direct child components of the component referenced by containerRef.
  For example, grandchild components of nested descendant components cannot be detected.

- Viewport Coordinate Constraint: When target coordinates are outside the browser viewport, detection behavior may differ for overlapping elements:
  - Within Viewport: Uses `document.elementFromPoint()` which respects CSS stacking context and z-index properly
  - Outside Viewport: Falls back to bounds-based detection using `getBoundingClientRect()`, which may return different results for overlapping elements due to different selection criteria (distance-based vs stacking context-based)
  
  This means that if you have overlapping child elements and specify coordinates outside the current viewport, the detected element might differ from what would be detected if the same coordinates were within the viewport.

### Performance Considerations

- The hook uses multiple observers (MutationObserver, ResizeObserver, IntersectionObserver) for comprehensive monitoring
- Detection callbacks are debounced to prevent excessive calls
- Observers are automatically cleaned up when the component unmounts or when disabled

----

## License

MIT License - see LICENSE file for details.

## Changelog

### 0.2.0
- CSS Unit Support: Added support for multiple coordinate unit types (px, %, vw, vh, rem, em)
- Flexible Coordinate System: Coordinates now accept both number (pixels) and string (CSS units) values
- Responsive Design: Percentage and viewport units automatically adapt to container and viewport size changes
- Enhanced API: Updated `OffsetCoordinates` interface to support `CSSUnitValue` type
- Improved Examples: Added comprehensive CSS unit usage examples in documentation

### 0.1.0
- Initial release with XY coordinate detection
- React component mapping support
- Comprehensive observer-based monitoring
- TypeScript support with full type definitions
