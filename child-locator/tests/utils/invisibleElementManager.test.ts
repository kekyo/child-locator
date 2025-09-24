// child-locator - A React Hook for locating child components at specific coordinates within a parent container
// Copyright (c) Kouji Matsui (@kekyo@mi.kekyo.net)
// Under MIT.
// https://github.com/kekyo/child-locator/

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InvisibleElementManager } from '../../src/utils/invisibleElementManager';

describe('InvisibleElementManager', () => {
  let container: HTMLElement;
  let manager: InvisibleElementManager;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    // Set more explicit settings so that size is recognized even in test environment
    container.style.width = '400px';
    container.style.height = '300px';
    container.style.position = 'relative';
    document.body.appendChild(container);
    manager = new InvisibleElementManager();
    manager.setContainer(container);
  });

  afterEach(() => {
    manager.cleanup();
    document.body.removeChild(container);
  });

  it('should create invisible element with correct styles', () => {
    const position = manager.getPositionFromCSSUnits('50px', '100px');

    // In test environment, position calculation may return 0,0 due to DOM limitations
    expect(position).not.toBeNull();
    expect(typeof position?.x).toBe('number');
    expect(typeof position?.y).toBe('number');

    // Verify that invisible element is added to container
    expect(container.children.length).toBe(1);

    const invisibleElement = container.children[0] as HTMLElement;
    expect(invisibleElement.getAttribute('data-locator-invisible')).toBe(
      'true'
    );
    expect(invisibleElement.style.position).toBe('absolute');
    expect(invisibleElement.style.left).toBe('50px');
    expect(invisibleElement.style.top).toBe('100px');
    expect(invisibleElement.style.visibility).toBe('hidden');
    expect(invisibleElement.style.pointerEvents).toBe('none');
  });

  it('should handle percentage units', () => {
    const position = manager.getPositionFromCSSUnits('50%', '25%');

    expect(position).not.toBeNull();
    expect(typeof position?.x).toBe('number');
    expect(typeof position?.y).toBe('number');

    const invisibleElement = container.children[0] as HTMLElement;
    expect(invisibleElement.style.left).toBe('50%');
    expect(invisibleElement.style.top).toBe('25%');
  });

  it('should handle viewport units', () => {
    const position = manager.getPositionFromCSSUnits('10vw', '5vh');

    expect(position).not.toBeNull();
    expect(typeof position?.x).toBe('number');
    expect(typeof position?.y).toBe('number');

    const invisibleElement = container.children[0] as HTMLElement;
    expect(invisibleElement.style.left).toBe('10vw');
    expect(invisibleElement.style.top).toBe('5vh');
  });

  it('should handle rem units', () => {
    const position = manager.getPositionFromCSSUnits('2rem', '1.5rem');

    expect(position).not.toBeNull();
    expect(typeof position?.x).toBe('number');
    expect(typeof position?.y).toBe('number');

    const invisibleElement = container.children[0] as HTMLElement;
    expect(invisibleElement.style.left).toBe('2rem');
    expect(invisibleElement.style.top).toBe('1.5rem');
  });

  it('should handle em units', () => {
    const position = manager.getPositionFromCSSUnits('3em', '2em');

    expect(position).not.toBeNull();
    expect(typeof position?.x).toBe('number');
    expect(typeof position?.y).toBe('number');

    const invisibleElement = container.children[0] as HTMLElement;
    expect(invisibleElement.style.left).toBe('3em');
    expect(invisibleElement.style.top).toBe('2em');
  });

  it('should handle number values', () => {
    const position = manager.getPositionFromCSSUnits(150, 200);

    // In test environment, position calculation may return 0,0 due to DOM limitations
    expect(position).not.toBeNull();
    expect(typeof position?.x).toBe('number');
    expect(typeof position?.y).toBe('number');

    const invisibleElement = container.children[0] as HTMLElement;
    expect(invisibleElement.style.left).toBe('150px');
    expect(invisibleElement.style.top).toBe('200px');
  });

  it('should reuse existing invisible element', () => {
    manager.getPositionFromCSSUnits('50px', '100px');
    expect(container.children.length).toBe(1);

    manager.getPositionFromCSSUnits('75px', '125px');
    expect(container.children.length).toBe(1); // Old element is removed and new element is created

    const invisibleElement = container.children[0] as HTMLElement;
    expect(invisibleElement.style.left).toBe('75px');
    expect(invisibleElement.style.top).toBe('125px');
  });

  it('should cleanup invisible elements', () => {
    manager.getPositionFromCSSUnits('50px', '100px');
    expect(container.children.length).toBe(1);

    manager.cleanup();
    expect(container.children.length).toBe(0);
  });

  it('should set correct styles for invisible element', () => {
    manager.getPositionFromCSSUnits('10%', '20%');

    const invisibleElement = container.children[0] as HTMLElement;

    // Verify that styles are set correctly
    expect(invisibleElement.style.position).toBe('absolute');
    expect(invisibleElement.style.left).toBe('10%');
    expect(invisibleElement.style.top).toBe('20%');
    expect(invisibleElement.style.width).toBe('1px');
    expect(invisibleElement.style.height).toBe('1px');
    expect(invisibleElement.style.visibility).toBe('hidden');
    expect(invisibleElement.style.pointerEvents).toBe('none');
    expect(invisibleElement.style.zIndex).toBe('-1');
    expect(invisibleElement.getAttribute('data-locator-invisible')).toBe(
      'true'
    );
  });
});
