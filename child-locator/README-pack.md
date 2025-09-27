# child-locator

A React Hook for detecting child components at specific XY coordinates within a container element.

[![NPM child-locator](https://img.shields.io/npm/v/child-locator)](https://www.npmjs.com/package/child-locator)
[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

## What is this?

If you're hesitant to manipulate delicate `Observers` to retrieve elements at specific positions displayed in the browser using React, the child-locator package might be useful.

This package identifies elements within a specified visible area of the page and makes it easy to retrieve the information held by those elements.
Since it's implemented using callback handlers, it can detect changes even when the layout shifts and elements change.

The detection position is not limited to absolute coordinates; it can also use various CSS units, enabling stable position detection for responsive design pages.

![demo project](images/demo.png)

Features:

- XY Coordinate Detection: Precisely locate child components at specified coordinates
- CSS Unit Support: Coordinate values support px (number), `%`, `vw`, `vh`, `rem`, `em` (string) and other CSS units
- Real-time Monitoring: Automatically detects changes in child elements using `MutationObserver`, `ResizeObserver`, and `IntersectionObserver`

## Installation

```bash
npm install child-locator
```

## Basic Usage

### 1. Setup Provider

First, setup your app with `ChildLocatorProvider`:

```tsx
import React from 'react';
import { ChildLocatorProvider } from 'child-locator';
import App from './App';

function Root() {
  return (
    <ChildLocatorProvider>
      <App />
    </ChildLocatorProvider>
  );
}
```

### 2. Create Trackable Components

Use `withChildLocator` to make components trackable:

```tsx
import React, { forwardRef } from 'react';
import { withChildLocator } from 'child-locator';
import type { WithChildLocatorProps } from 'child-locator';

// Base component (designed for your requirement)
const BaseChildItem = forwardRef<
  HTMLDivElement,
  {
    id: number;
    children: React.ReactNode;
  }
>(({ id, children }, ref) => {
  return (
    <div
      ref={ref}
      data-testid={`child-${id}`}
      style={{
        position: 'absolute',
        left: id * 100,
        top: id * 80,
        width: 80,
        height: 60,
        border: '1px solid #ccc',
        backgroundColor: '#f9f9f9',
      }}
    >
      {children}
    </div>
  );
});

// Make it trackable with child-locator
const ChildItem = withChildLocator(BaseChildItem);
```

> ℹ️ `withChildLocator` only accepts components that forward their `ref` to a DOM element (for example, ones created with `React.forwardRef`). Wrap plain function components with `forwardRef` before calling this HOC.

### 3. Use Detection Hook

Use `useLocator` to detect components at specific coordinates:

```tsx
import React, { useRef } from 'react';
import { useLocator } from 'child-locator';
import type { DetectedComponent } from 'child-locator';

const ParentComponent = () => {
  // Makes refer the container
  const containerRef = useRef<HTMLDivElement>(null);

  useLocator(containerRef, {
    // Detection coordinates: CSS units supported: px, %, vw, vh, rem, em
    offset: { x: '50%', y: '30%' },
    // Detected callback:
    onDetect: (component: DetectedComponent) => {
      if (component.element) {
        console.log('Detected element:', component.element);
        console.log('Distance from target:', component.distanceFromOffset);
        console.log(
          'Component metadata:',
          component.component?.props._tetherMetadata
        );
      } else {
        console.log('No child elements at target coordinates');
      }
    },
    enabled: true,
  });

  // Place detection target items into the container
  return (
    <div
      ref={containerRef}
      style={{ width: 400, height: 300, position: 'relative' }}
    >
      <ChildItem id={1} tetherMetadata={{ type: 'grid-item', row: 1, col: 1 }}>
        Item 1
      </ChildItem>
      <ChildItem id={2} tetherMetadata={{ type: 'grid-item', row: 1, col: 2 }}>
        Item 2
      </ChildItem>
      <ChildItem id={3} tetherMetadata={{ type: 'grid-item', row: 2, col: 1 }}>
        Item 3
      </ChildItem>
    </div>
  );
};
```

---

## Documentation

[See repository douments for detail](https://github.com/kekyo/child-locator).

## License

Under MIT.
