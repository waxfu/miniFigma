import type { Shape as ShapeModel } from '../types/shape'

interface ShapeProps {
  shape: ShapeModel
  selected: boolean
  zoom?: number
  markers?: boolean
}

const MARKER_SIZE = 8
const FRAME_GAP = 2

/** Отрисовка содержимого фигуры в координатах её бокса. */
function ShapeContent({ shape }: { shape: ShapeModel }) {
  if (shape.type === 'line') {
    return (
      <svg
        className="pointer-events-none absolute overflow-visible"
        style={{
          left: 0,
          top: 0,
          width: Math.max(shape.width, 1),
          height: Math.max(shape.height, 1),
        }}
      >
        <line
          x1={shape.x1 - shape.x}
          y1={shape.y1 - shape.y}
          x2={shape.x2 - shape.x}
          y2={shape.y2 - shape.y}
          stroke={shape.fill}
          strokeWidth={shape.strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (shape.type === 'text') {
    return (
      <div
        className="absolute left-0 top-0 overflow-visible"
        style={{
          color: shape.fill,
          fontSize: shape.fontSize,
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
        }}
      >
        {shape.content}
      </div>
    )
  }
  return (
    <div
      className="absolute left-0 top-0"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: shape.type === 'ellipse' ? '50%' : undefined,
        backgroundColor: shape.fill,
      }}
    />
  )
}

/**
 * Рендер одной фигуры: отрисовка по координатам.
 * При выделении добавляются рамка и маркеры вокруг фигуры —
 * их размер остаётся постоянным на экране независимо от зума.
 */
export function Shape({ shape, selected, zoom = 1, markers = true }: ShapeProps) {
  const s = FRAME_GAP / zoom
  const showSelection = selected && markers
  const markerPoints = [
    { left: -s, top: -s },
    { left: shape.width / 2, top: -s },
    { left: shape.width + s, top: -s },
    { left: shape.width + s, top: shape.height / 2 },
    { left: shape.width + s, top: shape.height + s },
    { left: shape.width / 2, top: shape.height + s },
    { left: -s, top: shape.height + s },
    { left: -s, top: shape.height / 2 },
  ]

  return (
    <div
      className="absolute overflow-visible"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
      }}
    >
      <ShapeContent shape={shape} />
      {showSelection && (
        <>
          <div
            className="pointer-events-none absolute"
            style={{
              left: -s,
              top: -s,
              width: shape.width + s * 2,
              height: shape.height + s * 2,
              borderRadius: shape.type === 'ellipse' ? '50%' : `${3 / zoom}px`,
              boxShadow: `0 0 0 ${1 / zoom}px #3b82f6`,
            }}
          />
          {markerPoints.map((point) => (
            <div
              key={`${point.left}:${point.top}`}
              className="pointer-events-none absolute rounded-sm bg-white ring-1 ring-blue-500"
              style={{
                left: point.left - MARKER_SIZE / 2,
                top: point.top - MARKER_SIZE / 2,
                width: MARKER_SIZE,
                height: MARKER_SIZE,
                transform: `scale(${1 / zoom})`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}