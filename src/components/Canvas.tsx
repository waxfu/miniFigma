import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Viewport } from '../hooks/useViewport'
import type { Shape as ShapeModel } from '../types/shape'
import type { MarqueeRect } from '../hooks/useShapes'
import { screenToCanvas } from '../utils/geometry'
import type { Point } from '../types/shape'
import { Shape } from './Shape'
import { TextEditor } from './TextEditor'

const GRID_SIZE = 20

interface CanvasProps {
  viewport: Viewport
  cursor: string
  shapes: ShapeModel[]
  draft: ShapeModel | null
  selectedIds: string[]
  marquee: MarqueeRect | null
  editingId: string | null
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: () => void
  zoomAt: (clientX: number, clientY: number, deltaY: number) => void
  onEditContent: (content: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onStartEdit: (point: Point) => void
}

/**
 * Холст на весь экран: сетка на фоне, панорамирование и зум холста.
 * Обрабатывает мышь, колесо и двойной клик для редактирования текста.
 */
export function Canvas({
  viewport,
  cursor,
  shapes,
  draft,
  selectedIds,
  marquee,
  editingId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  zoomAt,
  onEditContent,
  onCommitEdit,
  onCancelEdit,
  onStartEdit,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      zoomAt(event.clientX, event.clientY, event.deltaY)
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const editingShape =
    editingId != null ? (shapes.find((shape) => shape.id === editingId) ?? null) : null
  const editor = editingShape?.type === 'text' ? editingShape : null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none select-none overflow-hidden bg-zinc-900"
      style={{
        cursor,
        backgroundImage:
          'linear-gradient(to right, rgba(161, 161, 170, 0.14) 1px, transparent 1px), ' +
          'linear-gradient(to bottom, rgba(161, 161, 170, 0.14) 1px, transparent 1px)',
        backgroundSize: `${GRID_SIZE * viewport.zoom}px ${GRID_SIZE * viewport.zoom}px`,
        backgroundPosition: `${viewport.offsetX}px ${viewport.offsetY}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDoubleClick={(event) =>
        onStartEdit(screenToCanvas({ x: event.clientX, y: event.clientY }, viewport))
      }
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {shapes.map((shape) => (
          <Shape
            key={shape.id}
            shape={shape}
            selected={selectedIds.includes(shape.id)}
            zoom={viewport.zoom}
          />
        ))}
        {draft ? <Shape shape={draft} selected zoom={viewport.zoom} markers={false} /> : null}
        {marquee ? (
          <div
            className="pointer-events-none absolute"
            style={{
              left: marquee.x,
              top: marquee.y,
              width: marquee.width,
              height: marquee.height,
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              boxShadow: '0 0 0 1px #3b82f6',
            }}
          />
        ) : null}
        {editor ? (
          <TextEditor
            shape={editor}
            onContentChange={onEditContent}
            onCommit={onCommitEdit}
            onCancel={onCancelEdit}
          />
        ) : null}
      </div>
    </div>
  )
}