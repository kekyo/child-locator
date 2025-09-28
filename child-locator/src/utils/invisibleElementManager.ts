// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import type { CSSUnitValue } from '../types';

/**
 * Class for managing invisible elements
 * Manages temporary elements used for position detection in useLocator
 */
export class InvisibleElementManager {
  private container: HTMLElement | null = null;
  private invisibleElement: HTMLElement | null = null;
  private static readonly LOCATOR_MARKER = 'data-locator-invisible';

  /**
   * Set container
   */
  setContainer(container: HTMLElement | null): void {
    if (this.container !== container) {
      this.cleanup();
      this.container = container;
    }
  }

  /**
   * Place invisible element at specified position and get its actual coordinates
   */
  getPositionFromCSSUnits(
    x: CSSUnitValue,
    y: CSSUnitValue
  ): { x: number; y: number } | null {
    if (!this.container) {
      return null;
    }

    // Remove existing invisible element
    this.cleanup();

    // Create new invisible element
    this.invisibleElement = document.createElement('div');

    // Mark for exclusion from componentRef
    this.invisibleElement.setAttribute(
      InvisibleElementManager.LOCATOR_MARKER,
      'true'
    );

    // Set invisible element styles
    this.invisibleElement.style.position = 'absolute';
    this.invisibleElement.style.left = typeof x === 'number' ? `${x}px` : x;
    this.invisibleElement.style.top = typeof y === 'number' ? `${y}px` : y;
    this.invisibleElement.style.width = '1px';
    this.invisibleElement.style.height = '1px';
    this.invisibleElement.style.visibility = 'hidden';
    this.invisibleElement.style.pointerEvents = 'none';
    this.invisibleElement.style.zIndex = '-1';
    this.invisibleElement.style.opacity = '0';

    const shouldForceRelative = (() => {
      if (typeof window === 'undefined') {
        return false;
      }
      const computedPosition = window.getComputedStyle(this.container!);
      return computedPosition.position === 'static';
    })();

    const previousInlinePosition = this.container.style.position;

    if (shouldForceRelative) {
      this.container.style.position = 'relative';
    }

    try {
      // Add to container
      this.container.appendChild(this.invisibleElement);

      // Force layout calculation
      void this.container.offsetWidth;

      // Get position relative to container using offsetLeft and offsetTop
      const rect = this.invisibleElement.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
      };
    } finally {
      if (shouldForceRelative) {
        this.container.style.position = previousInlinePosition;
      }
    }
  }

  /**
   * Clean up invisible elements
   */
  cleanup(): void {
    if (this.invisibleElement && this.invisibleElement.parentNode) {
      this.invisibleElement.parentNode.removeChild(this.invisibleElement);
      this.invisibleElement = null;
    }
  }

  /**
   * Check if element is a locator invisible element
   */
  static isLocatorInvisibleElement(element: Element): boolean {
    return element.hasAttribute(InvisibleElementManager.LOCATOR_MARKER);
  }

  /**
   * Get visible children (excluding invisible elements)
   */
  static getVisibleChildren(container: Element): Element[] {
    return Array.from(container.children).filter(
      (child) => !InvisibleElementManager.isLocatorInvisibleElement(child)
    );
  }
}
