// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import { useCallback, useEffect, useRef, useMemo } from 'react';
import type { RefObject } from 'react';
import { useChildLocatorContext } from './useChildLocatorContext';
import type {
  DetectedComponent,
  UseLocatorOptions,
  OffsetCoordinates,
} from '../types';
import { InvisibleElementManager } from '../utils/invisibleElementManager';

type TetherInfo = {
  props?: Record<string, unknown>;
  metadata?: unknown;
};

type GetTetherFn = (element: HTMLElement) => TetherInfo | undefined;

/**
 * Determine whether an element participates in layout and appears within the viewport.
 * @param element - DOM element to evaluate for visibility.
 * @returns {boolean} `true` when the element should be considered hit-testable.
 */
const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  // Elements with no rendered area are effectively hidden and should be ignored
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  // CSS visibility/display overrides the geometry checks; bail early when hidden
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  // Ignore elements entirely outside the viewport so hit testing remains accurate
  const intersectsViewport =
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.left < window.innerWidth &&
    rect.top < window.innerHeight;

  return intersectsViewport;
};

/**
 * Locate the first tethered descendant that intersects the given offset within the container.
 * @param container - The root element whose descendants are inspected.
 * @param offset - Logical coordinates (can include CSS units) relative to the container.
 * @param getTether - Resolver returning tether metadata for a descendant element.
 * @param scrollContainerRef - Optional scroll container to adjust offsets against.
 * @returns {(HTMLElement | undefined)} The matching descendant element, if any.
 */
const findElementAtOffset = (
  container: HTMLElement,
  offset: OffsetCoordinates,
  getTether: GetTetherFn,
  scrollContainerRef?: RefObject<HTMLElement | null> | null
): HTMLElement | undefined => {
  // Attach temporary measuring utilities to the current container context
  const manager = new InvisibleElementManager();
  manager.setContainer(container);

  try {
    const pixelOffset = manager.getPositionFromCSSUnits(offset.x, offset.y);
    // Undefined offsets indicate unresolvable CSS units, so skip detection
    if (!pixelOffset) {
      return undefined;
    }

    let targetX: number, targetY: number;

    // Calculate absolute viewport coordinates considering scroll container
    if (scrollContainerRef?.current) {
      // Use the supplied scroll container so offsets follow the caller's scrolling context
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const scrollTop = scrollContainerRef.current.scrollTop;

      // Calculate coordinates relative to scroll container content
      targetX = containerRect.left + pixelOffset.x - scrollLeft;
      targetY = containerRect.top + pixelOffset.y - scrollTop;
    } else {
      const containerRect = container.getBoundingClientRect();
      targetX = containerRect.left + pixelOffset.x;
      targetY = containerRect.top + pixelOffset.y;
    }

    // Check if coordinates are within viewport bounds
    // Keep viewport hits fast; out-of-viewport detection is handled by the fallback path
    const isInViewport =
      targetX >= 0 &&
      targetX <= window.innerWidth &&
      targetY >= 0 &&
      targetY <= window.innerHeight;

    if (isInViewport) {
      // Prefer the browser's built-in hit testing when available
      const elementsAtPoint =
        typeof document.elementsFromPoint === 'function'
          ? document.elementsFromPoint(targetX, targetY)
          : (() => {
              // Legacy fallback: some browsers only expose a single element
              const single = document.elementFromPoint(targetX, targetY);
              return single ? [single] : [];
            })();

      // Walk every element reported at the coordinates and bubble up until the container
      for (const candidate of elementsAtPoint) {
        // Ignore SVG/text nodes that do not behave like HTMLElements for hit testing
        if (!(candidate instanceof HTMLElement)) {
          continue;
        }

        if (!container.contains(candidate)) {
          // Skip elements that visually overlap but belong to a different stacking context
          continue;
        }

        let element: HTMLElement | null = candidate;

        while (element && element !== container) {
          if (InvisibleElementManager.isLocatorInvisibleElement(element)) {
            // Ignore helper wrappers injected for measurement purposes
            element = element.parentElement;
            continue;
          }

          if (getTether(element) && isElementVisible(element)) {
            return element;
          }

          // Walk up the tree until we either find a tether or hit the container root
          element = element.parentElement;
        }
      }
    }

    // Fallback method: Use bounds checking for out-of-viewport coordinates
    return findElementByBounds(container, targetX, targetY, getTether);
  } finally {
    // Always restore DOM by removing the helper measurement nodes
    manager.cleanup();
  }
};

/**
 * Fallback element detection using getBoundingClientRect.
 * @param container - Root element containing potential matches.
 * @param targetX - Absolute X coordinate in viewport space.
 * @param targetY - Absolute Y coordinate in viewport space.
 * @param getTether - Resolver returning tether metadata for a descendant element.
 * @returns {(HTMLElement | undefined)} The closest matching element when viewport hit-testing fails.
 */
const findElementByBounds = (
  container: HTMLElement,
  targetX: number,
  targetY: number,
  getTether: GetTetherFn
): HTMLElement | undefined => {
  const descendants = container.querySelectorAll('*');

  const candidates: Array<{
    element: HTMLElement;
    distance: number;
    bounds: DOMRect;
  }> = [];

  // Evaluate every descendant because the target could be several levels deep
  descendants.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    if (InvisibleElementManager.isLocatorInvisibleElement(node)) {
      // Ignore synthetic measurement nodes injected by the locator itself
      return;
    }

    if (!getTether(node)) {
      // Only elements registered via context (tethers) are considered selectable
      return;
    }

    if (!isElementVisible(node)) {
      // Hidden elements cannot be interacted with, so they do not qualify as targets
      return;
    }

    const rect = node.getBoundingClientRect();

    const isWithinBounds =
      targetX >= rect.left &&
      targetX <= rect.right &&
      targetY >= rect.top &&
      targetY <= rect.bottom;

    if (isWithinBounds) {
      // Use the element's center point to determine the closest match
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(centerX - targetX, 2) + Math.pow(centerY - targetY, 2)
      );

      candidates.push({
        element: node,
        distance,
        bounds: rect,
      });
    }
  });

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const distanceDiff = a.distance - b.distance;
      if (Math.abs(distanceDiff) < 0.1) {
        // When distances are almost identical, prefer visually front-most (later) siblings
        const aIndex = Array.from(container.children).indexOf(a.element);
        const bIndex = Array.from(container.children).indexOf(b.element);
        return bIndex - aIndex;
      }
      return distanceDiff;
    });

    return candidates[0]?.element;
  }

  return undefined;
};

/**
 * React Hook that monitors a target element's descendants and reports the component nearest to an offset.
 * Uses react-attractor for component registration and retrieval.
 * @param containerRef - Ref pointing at the container element that should be monitored.
 * @param options - Runtime configuration such as offset, callbacks, and scroll container overrides.
 * @returns {void}
 */
export const useLocator = (
  containerRef: RefObject<HTMLElement | null>,
  options: UseLocatorOptions
): void => {
  const { offset, onDetect, enabled = true, scrollContainerRef } = options;
  // Destructure options so defaults and memoised references remain stable across renders

  // Get child locator context for component registration/retrieval
  const { getTether } = useChildLocatorContext();

  // Maintain Observer references for cleanup
  const observersRef = useRef<{
    mutation?: MutationObserver;
    resize?: ResizeObserver;
    intersection?: IntersectionObserver;
  }>({});

  // Stably maintain previous detection results to prevent unnecessary re-renders
  const lastResultRef = useRef<string>('');

  // Detection process execution flag for debouncing multiple rapid calls
  const processingRef = useRef(false);
  // Cache raw inputs so callbacks can read latest values without resubscribing

  // Ref to reference current values to avoid circular dependencies in useCallback
  const currentValuesRef = useRef({
    offset,
    enabled,
    onDetect,
    scrollContainerRef,
  });
  // Always expose latest inputs so asynchronous callbacks operate on current props/state
  currentValuesRef.current = { offset, enabled, onDetect, scrollContainerRef };

  const windowScrollRef = useRef<HTMLElement | null>(null);
  // Lazily resolve the window-level scrolling element if no container is supplied

  // Determine effective scroll container with automatic fallback to containerRef if scrollable
  const effectiveScrollContainerRef =
    useMemo((): RefObject<HTMLElement | null> | null => {
      // If explicitly specified, use it
      if (scrollContainerRef) {
        return scrollContainerRef;
      }

      // Check if containerRef itself is scrollable and use it as scroll container
      if (containerRef.current) {
        const style = getComputedStyle(containerRef.current);
        // Treat any overflow control as a signal that the element manages its own scroll area
        const isScrollable =
          style.overflow !== 'visible' ||
          style.overflowX !== 'visible' ||
          style.overflowY !== 'visible';

        if (isScrollable) {
          return containerRef;
        }
      }

      // No scroll container configured explicitly; try global scrolling element
      if (typeof document !== 'undefined') {
        const scrollElement =
          (document.scrollingElement as HTMLElement | null) ??
          document.documentElement ??
          document.body ??
          null;

        if (scrollElement) {
          windowScrollRef.current = scrollElement;
          return windowScrollRef;
        }
      }

      // No scroll container could be resolved (fallback to window events)
      return null;
    }, [scrollContainerRef, containerRef]);

  /**
   * Convert arbitrary CSS units into pixel coordinates within the container.
   * @param container - Element used for unit resolution context.
   * @param x - Horizontal offset in px or CSS units.
   * @param y - Vertical offset in px or CSS units.
   * @returns {{ x: number; y: number }} Normalised pixel coordinates.
   */
  const convertToPixels = useCallback(
    (
      container: HTMLElement,
      x: number | string,
      y: number | string
    ): { x: number; y: number } => {
      // Return as-is if it's already a number (px value)
      if (typeof x === 'number' && typeof y === 'number') {
        return { x, y };
      }

      // For CSS units, use invisible element for accurate conversion
      const manager = new InvisibleElementManager();
      manager.setContainer(container);

      try {
        const position = manager.getPositionFromCSSUnits(x, y);
        // Fallback to origin to avoid NaN results if conversion fails for exotic units
        return position || { x: 0, y: 0 };
      } finally {
        manager.cleanup();
      }
    },
    []
  );

  // Function to get component from element using tether context
  const getComponentFromElement = useCallback(
    (element: HTMLElement) => {
      const tetherInfo = getTether(element);
      if (tetherInfo) {
        // Create a React element from the tether information
        return {
          type: 'div', // Default type, could be extracted from tether metadata
          props: {
            ...tetherInfo.props,
            // Include metadata in a special property for easy access
            _tetherMetadata: tetherInfo.metadata,
          },
          key: null,
          ref: null,
        };
      }
      return undefined;
    },
    [getTether]
  );

  // Stabilize onDetect callback to prevent unnecessary effect re-runs
  const stableOnDetect = useCallback((component: DetectedComponent) => {
    // Hash the result to detect meaningful changes and avoid redundant calls
    const hash = JSON.stringify({
      hasElement: !!component.element,
      testId: component.element?.getAttribute('data-testid') || null,
      // Small variations in distance are noise; rounding keeps hashes stable
      distance: Math.round(component.distanceFromOffset * 10) / 10, // Round to 1 decimal place
    });

    // Do nothing if same as previous result
    if (lastResultRef.current === hash) {
      return;
    }

    lastResultRef.current = hash;
    currentValuesRef.current.onDetect(component);
  }, []);

  // Main detection logic with debouncing to avoid excessive processing
  const detectComponent = useCallback(() => {
    const { offset: currentOffset, enabled: currentEnabled } =
      currentValuesRef.current;
    const currentScrollContainerRef = effectiveScrollContainerRef;
    // Compare references rather than DOM nodes so the window fallback can be detected quickly
    const isWindowScrollContainer =
      currentScrollContainerRef === windowScrollRef;
    // Dereference lazily so we can detect when the consumer swaps scroll containers
    const currentScrollContainer = currentScrollContainerRef?.current ?? null;

    // Skip if already processing or conditions not met
    // - processingRef guards against re-entrant observer callbacks
    // - containerRef ensures the DOM node exists
    // - enabled centralises user-controlled toggling
    if (processingRef.current || !containerRef.current || !currentEnabled) {
      return;
    }

    // Prevent overlapping detection runs triggered by multiple observers
    processingRef.current = true;

    // Execute in next event loop to avoid React re-rendering cycle conflicts
    setTimeout(() => {
      try {
        if (!containerRef.current) {
          // The host element may unmount while queued; bail out gracefully
          processingRef.current = false;
          return;
        }

        // Find target element using coordinate-based detection
        const targetElement = findElementAtOffset(
          containerRef.current,
          currentOffset,
          getTether,
          currentScrollContainerRef && !isWindowScrollContainer
            ? currentScrollContainerRef
            : null
        );

        // Calculate target coordinates for distance measurement
        let targetX: number, targetY: number;
        const pixelOffset = convertToPixels(
          containerRef.current,
          currentOffset.x,
          currentOffset.y
        );

        if (currentScrollContainer && !isWindowScrollContainer) {
          const containerRect = currentScrollContainer.getBoundingClientRect();
          const scrollLeft = currentScrollContainer.scrollLeft;
          const scrollTop = currentScrollContainer.scrollTop;

          // Calculate coordinates relative to scroll container content
          targetX = containerRect.left + pixelOffset.x - scrollLeft;
          targetY = containerRect.top + pixelOffset.y - scrollTop;
        } else {
          const containerRect = containerRef.current.getBoundingClientRect();
          targetX = containerRect.left + pixelOffset.x;
          targetY = containerRect.top + pixelOffset.y;
        }

        let detectedComponent: DetectedComponent;

        if (!targetElement) {
          // When no child elements are detected at the target coordinates
          detectedComponent = {
            element: undefined,
            component: undefined,
            bounds: undefined,
            distanceFromOffset: 0,
          };
        } else {
          // When a child element is detected
          const bounds = targetElement.getBoundingClientRect();
          const elementCenterX = bounds.left + bounds.width / 2;
          const elementCenterY = bounds.top + bounds.height / 2;

          // Calculate Euclidean distance from target coordinates to element center
          const distanceFromOffset = Math.sqrt(
            Math.pow(elementCenterX - targetX, 2) +
              Math.pow(elementCenterY - targetY, 2)
          );

          detectedComponent = {
            element: targetElement,
            component: getComponentFromElement(targetElement),
            bounds,
            distanceFromOffset,
          };
        }

        stableOnDetect(detectedComponent);
      } finally {
        processingRef.current = false;
      }
    }, 0);
  }, [
    stableOnDetect,
    convertToPixels,
    containerRef,
    effectiveScrollContainerRef,
    getComponentFromElement,
  ]);

  // Observer setup for monitoring DOM changes and layout updates
  useEffect(() => {
    if (!containerRef.current || !enabled) {
      // Nothing to observe yet or feature toggled off
      return;
    }

    const targetElement = containerRef.current;
    const observers = observersRef.current;
    const currentScrollContainerRef = effectiveScrollContainerRef;
    const currentScrollContainer = currentScrollContainerRef?.current ?? null;
    const isWindowScrollContainer =
      currentScrollContainerRef === windowScrollRef &&
      typeof window !== 'undefined';

    // Clean up existing observers before setting up new ones
    if (observers.mutation) {
      observers.mutation.disconnect();
    }
    if (observers.resize) {
      observers.resize.disconnect();
    }
    if (observers.intersection) {
      observers.intersection.disconnect();
    }

    // Create MutationObserver for DOM tree changes
    observers.mutation = new MutationObserver(() => {
      detectComponent();
    });

    observers.mutation.observe(targetElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Create ResizeObserver for size changes when the API exists (older browsers may lack it)
    if (window.ResizeObserver) {
      observers.resize = new ResizeObserver(() => {
        detectComponent();
      });
      observers.resize.observe(targetElement);

      // Also observe all child elements for size changes
      const childElements = targetElement.querySelectorAll('*');
      // Each child can affect hit testing if it resizes, so attach the same observer
      childElements.forEach((child) => {
        if (child instanceof HTMLElement) {
          observers.resize!.observe(child);
        }
      });
    }

    // Setup scroll event listeners for scroll containers
    const handleScroll = () => {
      // Scrolling changes where the offsets land, so recompute detection
      detectComponent();
    };

    if (currentScrollContainer && !isWindowScrollContainer) {
      // Custom scroll container: listen directly for scrolls that change relative offsets
      currentScrollContainer.addEventListener('scroll', handleScroll);
    } else if (typeof window !== 'undefined') {
      // Fallback to window-level scroll events when no container is available
      window.addEventListener('scroll', handleScroll);
    }

    // Setup resize event listener for window
    const handleResize = () => {
      detectComponent();
    };

    // Window resizes change layout metrics globally; monitor them as a final safety net
    window.addEventListener('resize', handleResize);

    // Initial detection
    detectComponent();

    // Cleanup function
    return () => {
      if (observers.mutation) {
        observers.mutation.disconnect();
      }
      if (observers.resize) {
        observers.resize.disconnect();
      }
      if (observers.intersection) {
        observers.intersection.disconnect();
      }

      if (currentScrollContainer && !isWindowScrollContainer) {
        // Mirror the listener setup by removing container-bound scroll handlers
        currentScrollContainer.removeEventListener('scroll', handleScroll);
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }

      window.removeEventListener('resize', handleResize);
    };
  }, [
    detectComponent,
    enabled,
    containerRef,
    effectiveScrollContainerRef,
    windowScrollRef,
  ]);
};
