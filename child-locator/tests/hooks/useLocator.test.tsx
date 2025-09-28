// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import React, { useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useLocator,
  ChildLocatorProvider,
  withChildLocator,
} from '../../src/index';
import type {
  DetectedComponent,
  CSSUnitValue,
} from '../../src/types/useLocator';

// Test child component using withChildLocator
const BaseTestChild = React.forwardRef<
  HTMLDivElement,
  { id: number; height?: number }
>(({ id, height = 100 }, ref) => {
  return (
    <div
      ref={ref}
      data-testid={`child-${id}`}
      style={{
        width: '100px',
        height: `${height}px`,
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        margin: '5px',
      }}
    >
      Child {id}
    </div>
  );
});

BaseTestChild.displayName = 'BaseTestChild';

const InvalidChild = ({ id }: { id: number }) => <div>{id}</div>;
// @ts-expect-error withChildLocator requires a component that forwards its ref to a DOM element.
withChildLocator(InvalidChild);

// Wrap with tether to enable component tracking
const TestChild = withChildLocator(BaseTestChild);

const TestContainer = ({
  offset,
  onDetect,
  children,
}: {
  offset: { x: CSSUnitValue; y: CSSUnitValue };
  onDetect: (detected: DetectedComponent | null) => void;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [detected, setDetected] = useState<DetectedComponent | null>(null);

  useLocator(containerRef, {
    offset,
    onDetect: (detectedComponent) => {
      setDetected(detectedComponent);
      onDetect(detectedComponent);
    },
    enabled: true,
  });

  return (
    <div>
      <div data-testid="detected-info">Detected: {detected ? 'yes' : 'no'}</div>
      <div
        ref={containerRef}
        data-testid="container"
        style={{ width: '400px', height: '300px', position: 'relative' }}
      >
        {children}
      </div>
    </div>
  );
};

const TestScrollContainer = ({
  offset,
  onDetect,
  children,
}: {
  offset: { x: CSSUnitValue; y: CSSUnitValue };
  onDetect: (detected: DetectedComponent | null) => void;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [detected, setDetected] = useState<DetectedComponent | null>(null);

  useLocator(containerRef, {
    offset,
    onDetect: (detectedComponent) => {
      setDetected(detectedComponent);
      onDetect(detectedComponent);
    },
    enabled: true,
    scrollContainerRef: scrollContainerRef,
  });

  return (
    <div>
      <div data-testid="detected-info">Detected: {detected ? 'yes' : 'no'}</div>
      <div
        data-testid="header"
        style={{ height: '50px', backgroundColor: '#ccc', flexShrink: 0 }}
      >
        Header (Fixed)
      </div>
      <div
        ref={scrollContainerRef}
        data-testid="scroll-container"
        style={{
          height: '300px',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        <div
          ref={containerRef}
          data-testid="container"
          style={{ width: '400px', height: '600px', position: 'relative' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

describe('useLocator with ChildLocatorProvider', () => {
  let detectedComponents: (DetectedComponent | null)[] = [];

  const mockOnDetect = (detected: DetectedComponent | null) => {
    detectedComponents.push(detected);
  };

  beforeEach(() => {
    detectedComponents = [];
  });

  it('should detect component at XY offset', async () => {
    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} tetherMetadata={{ childId: 1 }} />
          <TestChild id={2} height={80} tetherMetadata={{ childId: 2 }} />
          <TestChild id={3} height={80} tetherMetadata={{ childId: 3 }} />
        </TestContainer>
      </ChildLocatorProvider>
    );

    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    // Check the last detected component
    const lastDetected = detectedComponents[detectedComponents.length - 1];
    expect(lastDetected).not.toBeNull();
    expect(lastDetected?.element).toBeInstanceOf(HTMLElement);
  });

  it('should detect components correctly', async () => {
    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} tetherMetadata={{ childId: 1 }} />
          <TestChild id={2} height={80} tetherMetadata={{ childId: 2 }} />
          <TestChild id={3} height={80} tetherMetadata={{ childId: 3 }} />
        </TestContainer>
      </ChildLocatorProvider>
    );

    // Verify that detection callback is called
    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    // Check the last detected component
    const lastDetected = detectedComponents[detectedComponents.length - 1];
    expect(lastDetected).not.toBeNull();
    expect(lastDetected?.element).toBeInstanceOf(HTMLElement);
  });

  it('should handle empty container', async () => {
    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          {null}
        </TestContainer>
      </ChildLocatorProvider>
    );

    // For empty containers, DetectedComponent with no child elements is returned
    await waitFor(() => {
      expect(
        detectedComponents.some((d) => d !== null && d.element === undefined)
      ).toBe(true);
    });
  });

  it('should calculate distance from offset correctly', async () => {
    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: 100, y: 100 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={50} />
          <TestChild id={2} height={50} />
        </TestContainer>
      </ChildLocatorProvider>
    );

    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    const detected = detectedComponents.find((d) => d !== null);
    expect(detected).toBeDefined();
    expect(detected?.distanceFromOffset).toBeGreaterThanOrEqual(0);
  });

  it('should support CSS unit strings for offset', async () => {
    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: '50%', y: '25%' }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
          <TestChild id={2} height={80} />
        </TestContainer>
      </ChildLocatorProvider>
    );

    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    const lastDetected = detectedComponents[detectedComponents.length - 1];
    expect(lastDetected).not.toBeNull();
    expect(typeof lastDetected?.distanceFromOffset).toBe('number');
  });

  it('should support mixed units (number and string)', async () => {
    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: 100, y: '50%' }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
          <TestChild id={2} height={80} />
        </TestContainer>
      </ChildLocatorProvider>
    );

    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    const lastDetected = detectedComponents[detectedComponents.length - 1];
    expect(lastDetected).not.toBeNull();
    expect(typeof lastDetected?.distanceFromOffset).toBe('number');
  });

  it('should work with scroll container for scroll-relative coordinate calculation', async () => {
    render(
      <ChildLocatorProvider>
        <TestScrollContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
          <TestChild id={2} height={80} />
          <TestChild id={3} height={80} />
        </TestScrollContainer>
      </ChildLocatorProvider>
    );

    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    const lastDetected = detectedComponents[detectedComponents.length - 1];
    expect(lastDetected).not.toBeNull();
    expect(lastDetected?.element).toBeInstanceOf(HTMLElement);

    // Test scroll behavior
    const scrollContainer = screen.getByTestId('scroll-container');
    scrollContainer.scrollTop = 100;

    // Allow time for scroll event handling
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Detection should still work after scrolling
    expect(detectedComponents.length).toBeGreaterThan(0);
  });

  it('should keep detecting elements for percentage offsets during window scroll', async () => {
    const scrollYDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'scrollY'
    );
    const scrollXDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'scrollX'
    );
    const innerHeightDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'innerHeight'
    );
    const innerWidthDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'innerWidth'
    );

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });

    const elementsFromPointDescriptor = Object.getOwnPropertyDescriptor(
      document,
      'elementsFromPoint'
    );

    if (!elementsFromPointDescriptor) {
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        writable: true,
        value: ((x: number, y: number) => {
          const single = document.elementFromPoint?.(x, y);
          return single ? [single] : [];
        }) as typeof document.elementsFromPoint,
      });
    }

    const elementsFromPointMock = vi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(document as any, 'elementsFromPoint')
      .mockReturnValue([]);

    try {
      render(
        <ChildLocatorProvider>
          <TestContainer offset={{ x: 0, y: 100 }} onDetect={mockOnDetect}>
            <TestChild id={1} height={80} tetherMetadata={{ childId: 1 }} />
            <TestChild id={2} height={80} tetherMetadata={{ childId: 2 }} />
          </TestContainer>
        </ChildLocatorProvider>
      );

      const container = screen.getByTestId('container');
      // Simulate a statically positioned container (no inline position set)
      container.style.position = '';

      const containerRect = DOMRect.fromRect({
        x: 0,
        y: -600,
        width: 400,
        height: 2000,
      });

      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
        containerRect
      );

      const detectedChild = screen.getByTestId('child-2');
      const childRect = DOMRect.fromRect({
        x: 0,
        y: 0,
        width: 200,
        height: 80,
      });

      vi.spyOn(detectedChild, 'getBoundingClientRect').mockReturnValue(
        childRect
      );

      elementsFromPointMock.mockImplementation((x, y) => {
        // Ensure the hook queries within the viewport rather than negative coordinates
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(window.innerHeight);
        return [detectedChild];
      });

      await waitFor(() => {
        expect(detectedComponents.length).toBeGreaterThan(0);
      });

      const lastDetected = detectedComponents[detectedComponents.length - 1];
      expect(lastDetected?.element).toBe(detectedChild);
    } finally {
      elementsFromPointMock.mockRestore();

      if (elementsFromPointDescriptor) {
        Object.defineProperty(
          document,
          'elementsFromPoint',
          elementsFromPointDescriptor
        );
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (document as any).elementsFromPoint;
      }

      if (scrollYDescriptor) {
        Object.defineProperty(window, 'scrollY', scrollYDescriptor);
      }
      if (scrollXDescriptor) {
        Object.defineProperty(window, 'scrollX', scrollXDescriptor);
      }
      if (innerHeightDescriptor) {
        Object.defineProperty(window, 'innerHeight', innerHeightDescriptor);
      }
      if (innerWidthDescriptor) {
        Object.defineProperty(window, 'innerWidth', innerWidthDescriptor);
      }
    }
  });

  it('should fall back to the global scrolling element when none is provided', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      document,
      'scrollingElement'
    );
    const scrollingElementGetter = vi.fn(() => document.documentElement);

    Object.defineProperty(document, 'scrollingElement', {
      configurable: true,
      get: scrollingElementGetter,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    try {
      render(
        <ChildLocatorProvider>
          <TestContainer
            offset={{ x: '50%', y: '25%' }}
            onDetect={mockOnDetect}
          >
            <TestChild id={1} height={80} />
            <TestChild id={2} height={80} />
          </TestContainer>
        </ChildLocatorProvider>
      );

      await waitFor(() => {
        expect(detectedComponents.length).toBeGreaterThan(0);
      });

      expect(scrollingElementGetter).toHaveBeenCalled();

      const registeredScrollHandler = addEventListenerSpy.mock.calls.some(
        ([eventName]) => eventName === 'scroll'
      );
      expect(registeredScrollHandler).toBe(true);

      window.dispatchEvent(new Event('scroll'));

      await new Promise((resolve) => setTimeout(resolve, 0));
    } finally {
      addEventListenerSpy.mockRestore();

      if (originalDescriptor) {
        Object.defineProperty(document, 'scrollingElement', originalDescriptor);
      } else {
        delete (document as unknown as Record<string, unknown>)
          .scrollingElement;
      }
    }
  });

  it('should retrieve component metadata from tethered elements', async () => {
    const specificMetadata = {
      componentType: 'test-component',
      uniqueId: 'test-123',
      category: 'interaction',
    };

    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={100} tetherMetadata={specificMetadata} />
        </TestContainer>
      </ChildLocatorProvider>
    );

    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    // Find a detection with tether information
    const detectedWithChildLocator = detectedComponents.find(
      (d) => d?.component
    );
    expect(detectedWithChildLocator).toBeDefined();
    expect(detectedWithChildLocator?.component).toBeDefined();

    // Verify props are accessible
    const props = detectedWithChildLocator?.component?.props as {
      id: number;
      height: number;
      _tetherMetadata: {
        componentType: string;
        uniqueId: string;
        category: string;
      };
    };
    expect(props).toBeDefined();
    expect(props.id).toBe(1);
    expect(props.height).toBe(100);

    // Verify that tether metadata is accessible
    expect(props._tetherMetadata).toBeDefined();
    expect(props._tetherMetadata.componentType).toBe('test-component');
    expect(props._tetherMetadata.uniqueId).toBe('test-123');
    expect(props._tetherMetadata.category).toBe('interaction');

    // This confirms that react-attractor integration is working correctly
    // and we can identify components by their metadata, not just DOM attributes
  });

  it('should provide bounds information for detected elements', async () => {
    render(
      <ChildLocatorProvider>
        <TestContainer offset={{ x: 50, y: 50 }} onDetect={mockOnDetect}>
          <TestChild id={1} height={80} />
        </TestContainer>
      </ChildLocatorProvider>
    );

    await waitFor(() => {
      expect(detectedComponents.length).toBeGreaterThan(0);
    });

    const detected = detectedComponents.find((d) => d !== null && d.element);
    expect(detected).toBeDefined();
    expect(detected?.bounds).toBeDefined();
    expect(detected?.bounds?.width).toBeGreaterThan(0);
    expect(detected?.bounds?.height).toBeGreaterThan(0);
  });
});
