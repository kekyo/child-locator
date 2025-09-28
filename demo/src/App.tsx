import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useLocator, withChildLocator } from 'child-locator';
import type { DetectedComponent, OffsetCoordinates } from 'child-locator';

/////////////////////////////////////////////////////////////////////////////

interface GridItem {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
}

// Grid item component wrapped with Tether
const BaseGridItem = React.forwardRef<
  HTMLDivElement,
  {
    item: GridItem;
    children: React.ReactNode;
  }
>(({ item, children }, ref) => {
  return (
    <div
      ref={ref}
      data-testid={item.id}
      style={{
        position: 'absolute',
        left: `${item.x + 10}px`,
        top: `${item.y + 10}px`,
        width: '180px',
        height: '130px',
        border: '3px solid #0066cc',
        backgroundColor: '#e6f3ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#0066cc',
        borderRadius: '8px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
});

BaseGridItem.displayName = 'BaseGridItem';

const GridItem = withChildLocator(BaseGridItem);

/////////////////////////////////////////////////////////////////////////////

const BaseNestedItem = React.forwardRef<
  HTMLDivElement,
  {
    id: string;
    label: string;
  }
>(({ id, label }, ref) => {
  return (
    <div
      ref={ref}
      data-testid={id}
      style={{
        width: '140px',
        height: '90px',
        backgroundColor: '#fde6f4',
        border: '2px solid #ad1457',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontWeight: 600,
        color: '#ad1457',
        boxShadow: '0 3px 8px rgba(173, 20, 87, 0.2)',
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: '12px' }}>Nested Target</span>
    </div>
  );
});

BaseNestedItem.displayName = 'BaseNestedItem';

const NestedItem = withChildLocator(BaseNestedItem);

/////////////////////////////////////////////////////////////////////////////

type LocatorVariant = 'Element scroll' | 'Window scroll';
type OffsetMode = 'pointer' | 'anchor';

const LocatorTestPage: React.FC<{ variant: LocatorVariant }> = ({
  variant,
}) => {
  const useWindowScroll = variant === 'Window scroll';
  const [offsetMode, setOffsetMode] = useState<OffsetMode>('pointer');
  const [pointerOffset, setPointerOffset] = useState<OffsetCoordinates>({
    x: 0,
    y: 0,
  });
  const [detected, setDetected] = useState<DetectedComponent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerContainerRef = useRef<HTMLDivElement>(null);
  const lastMouseEventRef = useRef<{ clientX: number; clientY: number } | null>(
    null
  );

  const gridItems = useMemo(() => {
    const items: GridItem[] = [];
    // Build rows (10) first so Y coordinates increment downward
    for (let row = 0; row < 10; row++) {
      // Inner loop covers 3 columns; combined with row loop gives 30 items
      for (let col = 0; col < 3; col++) {
        const id = `Item-${row + 1}-${col + 1}`;
        items.push({
          id,
          row,
          col,
          x: col * 200,
          y: row * 150,
        });
      }
    }
    return items;
  }, []);
  const childrenCount = gridItems.length; // 30 items in 3x10 grid

  const handleDetect = useCallback(
    (detectedComponent: DetectedComponent) => {
      setDetected(detectedComponent);
    },
    [setDetected]
  );

  // Unified coordinate calculation
  const calculatePointerOffset = useCallback(
    (clientX: number, clientY: number): OffsetCoordinates | null => {
      const rect = containerRef.current?.getBoundingClientRect();
      const innerRect = innerContainerRef.current?.getBoundingClientRect();
      // Bail out if the layout metrics are unavailable (container not rendered yet)
      if (!rect || !innerRect) return null;

      // Calculate coordinates relative to innerContainer
      const x = clientX - innerRect.left;
      const y = clientY - innerRect.top;

      return { x: Math.round(x), y: Math.round(y) };
    },
    []
  );
  const anchorOffset = useMemo<OffsetCoordinates>(
    () => ({ x: '50%', y: '20%' }),
    []
  );

  const effectiveOffset: OffsetCoordinates =
    offsetMode === 'pointer' ? pointerOffset : anchorOffset;

  const renderOffsetModeButton = useCallback(
    (mode: OffsetMode, label: string) => {
      const isActive = offsetMode === mode;
      return (
        <button
          key={mode}
          type="button"
          onClick={() => setOffsetMode(mode)}
          disabled={isActive}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: isActive ? '2px solid #ad1457' : '1px solid #ccc',
            backgroundColor: isActive ? '#ad1457' : '#ffffff',
            color: isActive ? '#ffffff' : '#333333',
            cursor: isActive ? 'default' : 'pointer',
            fontWeight: isActive ? 600 : 500,
          }}
        >
          {label}
        </button>
      );
    },
    [offsetMode, setOffsetMode]
  );

  useLocator(innerContainerRef, {
    offset: effectiveOffset,
    onDetect: handleDetect,
    enabled: true,
    scrollContainerRef: useWindowScroll ? undefined : containerRef,
  });

  // Update coordinates on scroll
  useEffect(() => {
    if (offsetMode !== 'pointer') {
      return;
    }

    const handleScroll = () => {
      // Without a previously tracked mouse event we cannot rebuild the offset
      if (!lastMouseEventRef.current) return;

      const newOffset = calculatePointerOffset(
        lastMouseEventRef.current.clientX,
        lastMouseEventRef.current.clientY
      );
      if (newOffset) {
        setPointerOffset(newOffset);
      }
    };

    if (useWindowScroll) {
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);

    return () => {
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [calculatePointerOffset, offsetMode, useWindowScroll]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (offsetMode !== 'pointer') {
      return;
    }
    // Record last mouse position
    lastMouseEventRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    const newOffset = calculatePointerOffset(event.clientX, event.clientY);
    // Skip state updates when the cursor falls outside the container bounds
    if (newOffset) {
      setPointerOffset(newOffset);
    }
  };

  const outerStyle: React.CSSProperties = {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    ...(useWindowScroll ? { minHeight: '100vh' } : { height: '100vh' }),
  };

  const containerStyle: React.CSSProperties = useWindowScroll
    ? {
        width: '100%',
        border: '2px solid #333',
        position: 'relative',
        backgroundColor: '#fafafa80',
        marginTop: '16px',
      }
    : {
        width: '100%',
        height: '500px',
        border: '2px solid #333',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: '#fafafa80',
      };

  const infoWrapperStyle: React.CSSProperties = useWindowScroll
    ? {
        position: 'sticky',
        top: '10px',
        zIndex: 10,
        display: 'grid',
        gap: '10px',
        padding: '12px 15px',
        borderRadius: '8px',
        backgroundColor: 'rgba(240, 240, 240, 0.92)',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(4px)',
        marginBottom: '10px',
      }
    : {
        display: 'grid',
        gap: '10px',
        padding: '0 5px',
        marginBottom: '10px',
      };

  const infoPanelStyle: React.CSSProperties = {
    backgroundColor: '#f0f0f080',
    padding: '10px 15px',
    borderRadius: '5px',
  };

  return (
    <div style={outerStyle}>
      <div style={infoWrapperStyle}>
        {/* Description */}
        <div style={infoPanelStyle} data-testid="description-panel">
          <p>
            <strong>Description:</strong>
          </p>
          <ul>
            <li>3 columns x 10 rows grid is displayed</li>
            <li>Blue borders make items easy to identify</li>
            <li>Red dot indicates mouse position</li>
          </ul>
        </div>
        {/* child-locator detection results display area */}
        <div style={infoPanelStyle} data-testid="detection-summary">
          <h3>child-locator Detection Information:</h3>
          <ul>
            <li data-testid="offset-mode">
              <strong>Offset mode:</strong>{' '}
              <span
                style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}
              >
                {renderOffsetModeButton('pointer', 'Follow pointer')}
                {renderOffsetModeButton('anchor', 'Viewport anchor')}
              </span>
            </li>
            <li data-testid="mouse-coordinates">
              {offsetMode === 'pointer' ? (
                <>
                  <strong>Mouse Coordinates:</strong> X: {pointerOffset.x}px, Y:{' '}
                  {pointerOffset.y}px
                </>
              ) : (
                <>
                  <strong>Viewport Anchor:</strong> X: {anchorOffset.x}, Y:{' '}
                  {anchorOffset.y}
                </>
              )}
            </li>
            <li data-testid="managed-count">
              <strong>Managed Components Count:</strong> {childrenCount}
            </li>
            <li data-testid="detected-item">
              <strong>Detected Item:</strong>{' '}
              {detected?.element
                ? (() => {
                    // Use data-testid when available; otherwise fall back to visible text
                    const testId = detected.element.getAttribute('data-testid');
                    const elementText =
                      detected.element.textContent?.split('\n')[0]; // Get the first line of text
                    const displayName =
                      testId || elementText || 'Unknown Element';
                    return `${displayName} (Distance: ${detected.distanceFromOffset.toFixed(1)}px)`;
                  })()
                : 'None'}
            </li>
            <li data-testid="element-bounds">
              <strong>Element Bounds:</strong>{' '}
              {detected?.bounds
                ? `${detected.bounds.width.toFixed(0)}x${detected.bounds.height.toFixed(0)} at (${detected.bounds.x.toFixed(0)}, ${detected.bounds.y.toFixed(0)})`
                : '(None)'}
            </li>
          </ul>
        </div>
      </div>

      {/* Scrollable grid area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={containerStyle}
        data-testid="grid-container"
      >
        <div
          ref={innerContainerRef}
          style={{
            width: '700px',
            height: '1800px',
            position: 'relative',
          }}
        >
          {/* Mouse position indicator */}
          {offsetMode === 'pointer' ? (
            <div
              style={{
                position: 'absolute',
                left: `${pointerOffset.x}px`,
                top: `${pointerOffset.y}px`,
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                borderRadius: '50%',
                zIndex: 1000,
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ) : null}
          {offsetMode === 'anchor' ? (
            <div
              style={{
                position: 'absolute',
                left: anchorOffset.x,
                top: anchorOffset.y,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px dashed #ff7043',
                backgroundColor: 'rgba(255, 112, 67, 0.25)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            />
          ) : null}

          {gridItems.map((item) => (
            // Each GridItem registers itself with child-locator via the HOC and exposes metadata
            <GridItem
              key={item.id}
              item={item}
              tetherMetadata={{
                itemId: item.id,
                position: { x: item.x, y: item.y },
                row: item.row,
                col: item.col,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div>{item.id}</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  ({item.x}, {item.y})
                </div>
              </div>
            </GridItem>
          ))}

          <div
            data-testid="nested-wrapper-outer"
            style={{
              position: 'absolute',
              left: '40px',
              top: '1550px',
              width: '240px',
              padding: '18px',
              backgroundColor: '#fef6fb',
              borderRadius: '18px',
              border: '2px solid rgba(173, 20, 87, 0.2)',
              boxShadow: '0 10px 18px rgba(173, 20, 87, 0.08)',
            }}
          >
            <div
              data-testid="nested-wrapper-middle"
              style={{
                padding: '18px',
                background:
                  'linear-gradient(135deg, rgba(173, 20, 87, 0.12), rgba(173, 20, 87, 0.05))',
                borderRadius: '14px',
                border: '2px solid rgba(173, 20, 87, 0.25)',
              }}
            >
              <div
                data-testid="nested-wrapper-inner"
                style={{
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid rgba(173, 20, 87, 0.2)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <NestedItem id="Nested-Item-1" label="Nested Item 1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/////////////////////////////////////////////////////////////////////////////

const App = () => {
  const [activePage, setActivePage] =
    useState<LocatorVariant>('Element scroll');

  const renderToggleButton = (variant: LocatorVariant) => {
    const isActive = activePage === variant;
    return (
      <button
        key={variant}
        type="button"
        onClick={() => setActivePage(variant)}
        disabled={isActive}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: isActive ? '2px solid #0066cc' : '1px solid #ccc',
          backgroundColor: isActive ? '#0066cc' : '#ffffff',
          color: isActive ? '#ffffff' : '#333333',
          cursor: isActive ? 'default' : 'pointer',
          fontWeight: isActive ? 600 : 500,
        }}
      >
        {variant}
      </button>
    );
  };

  return (
    <div>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #dddddd80',
          backgroundColor: '#f7f7f780',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <strong>Choose test page:</strong>
        {(['Element scroll', 'Window scroll'] as LocatorVariant[]).map(
          renderToggleButton
        )}
      </div>
      <LocatorTestPage variant={activePage} />
    </div>
  );
};

export default App;
