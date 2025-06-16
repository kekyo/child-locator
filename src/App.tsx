import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocator, withTether } from './index'
import type { DetectedComponent } from './types/useLocator'

interface GridItem {
  id: string
  row: number
  col: number
  x: number
  y: number
}

// Tetherでラップされたグリッドアイテムコンポーネント
const BaseGridItem = React.forwardRef<HTMLDivElement, { 
  item: GridItem
  children: React.ReactNode 
}>(({ item, children }, ref) => {
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
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  )
})

BaseGridItem.displayName = 'BaseGridItem'

const GridItem = withTether(BaseGridItem)

function App() {
  const [mouseOffset, setMouseOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [detected, setDetected] = useState<DetectedComponent | null>(null)
  const childrenCount = 30 // 3x10のグリッドなので30個
  const containerRef = useRef<HTMLDivElement>(null)
  const innerContainerRef = useRef<HTMLDivElement>(null)
  const lastMouseEventRef = useRef<{ clientX: number; clientY: number } | null>(null)

  // child-locatorを使用してコンポーネント検出（innerContainerRefを使用）
  useLocator(innerContainerRef, {
    offset: mouseOffset,
    onDetect: (detectedComponent) => {
      setDetected(detectedComponent)
    },
    enabled: true,
    scrollContainerRef: containerRef,
  })

  // 座標計算を共通化
  const calculateMouseOffset = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const innerRect = innerContainerRef.current?.getBoundingClientRect()
    if (!rect || !innerRect) return null

    // innerContainer相対の座標を計算
    const x = clientX - innerRect.left
    const y = clientY - innerRect.top

    return { x: Math.round(x), y: Math.round(y) }
  }, [])

  // スクロール時の座標更新
  useEffect(() => {
    const handleScroll = () => {
      if (!lastMouseEventRef.current) return
      
      const newOffset = calculateMouseOffset(
        lastMouseEventRef.current.clientX,
        lastMouseEventRef.current.clientY
      )
      if (newOffset) {
        setMouseOffset(newOffset)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [calculateMouseOffset])

  // 3x10のグリッドデータを生成
  const gridItems: GridItem[] = []
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 3; col++) {
      const id = `アイテム-${row + 1}-${col + 1}`
      gridItems.push({
        id,
        row,
        col,
        x: col * 200,
        y: row * 150
      })
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // 最後のマウス位置を記録
    lastMouseEventRef.current = {
      clientX: event.clientX,
      clientY: event.clientY
    }

    const newOffset = calculateMouseOffset(event.clientX, event.clientY)
    if (newOffset) {
      setMouseOffset(newOffset)
    }
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1>child-locatorテストページ - 3x10グリッド</h1>
      
      {/* child-locatorの検出結果表示エリア */}
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
        minHeight: '100px'
      }}>
        <h3>child-locator検出情報:</h3>
        <div>
          <p><strong>マウス座標:</strong> X: {mouseOffset.x}px, Y: {mouseOffset.y}px</p>
          <p><strong>管理されているコンポーネント数:</strong> {childrenCount}</p>
          <p><strong>検出されたアイテム:</strong> {' '}
            {detected?.element ? 
              `${detected.element.textContent?.split('(')[0]} (距離: ${detected.distanceFromOffset.toFixed(1)}px)` : 
              'なし'
            }
          </p>
          <p><strong>要素の境界:</strong> {detected?.bounds ? 
            `${detected.bounds.width.toFixed(0)}x${detected.bounds.height.toFixed(0)} at (${detected.bounds.x.toFixed(0)}, ${detected.bounds.y.toFixed(0)})` : 
            '(なし)'
          }</p>
        </div>
      </div>

      {/* スクロール可能なグリッドエリア */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{
          width: '100%',
          height: '500px',
          border: '2px solid #333',
          overflow: 'auto',
          position: 'relative',
          backgroundColor: '#fafafa'
        }}
      >
        <div 
          ref={innerContainerRef}
          style={{
            width: '600px',
            height: '1500px',
            position: 'relative'
          }}>
          {/* マウス位置インジケーター */}
          <div 
            style={{
              position: 'absolute',
              left: `${mouseOffset.x}px`,
              top: `${mouseOffset.y}px`,
              width: '10px',
              height: '10px',
              backgroundColor: 'red',
              borderRadius: '50%',
              zIndex: 1000,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)'
            }}
          />

          {gridItems.map((item) => (
            <GridItem 
              key={item.id} 
              item={item}
              tetherMetadata={{
                itemId: item.id,
                position: { x: item.x, y: item.y },
                row: item.row,
                col: item.col
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
        </div>
      </div>

      <div style={{ 
        marginTop: '15px', 
        fontSize: '14px', 
        color: '#666' 
      }}>
        <p><strong>説明:</strong></p>
        <ul>
          <li>3列x10行のグリッドが表示されています</li>
          <li>青いボーダーで識別しやすくしています</li>
          <li>赤い点がマウス位置を示します</li>
          <li><strong>child-locatorライブラリ</strong>が座標に基づいて要素を検出します</li>
          <li>検出された要素の詳細情報が上部に表示されます</li>
          <li>エリア内でスクロールできます</li>
        </ul>
      </div>
    </div>
  )
}

export default App
