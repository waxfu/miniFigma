import type { Point, Shape } from '../types/shape'

/** Параметры «камеры»: сдвиг холста и коэффициент зума. */
export interface Viewport {
  offsetX: number
  offsetY: number
  zoom: number
}

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

/** Пределы зума: от 10% до 400%. */
export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

/**
 * Переводит экранную координату в координату канваса
 * с учётом панорамирования (offset) и зума.
 */
export function screenToCanvas(screen: Point, viewport: Viewport): Point {
  return {
    x: (screen.x - viewport.offsetX) / viewport.zoom,
    y: (screen.y - viewport.offsetY) / viewport.zoom,
  }
}

/** Обратный пересчёт: координата канваса -> экранная. */
export function canvasToScreen(canvas: Point, viewport: Viewport): Point {
  return {
    x: canvas.x * viewport.zoom + viewport.offsetX,
    y: canvas.y * viewport.zoom + viewport.offsetY,
  }
}

/** Проверка попадания точки в прямоугольник. */
export function pointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  const { x, y, width, height } = rect
  return (
    width > 0 &&
    height > 0 &&
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  )
}

/** Расстояние от точки до отрезка (для hit-теста линии). */
export function pointToSegmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  if (lengthSq === 0) return Math.hypot(point.x - a.x, point.y - a.y)
  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))
  const px = a.x + t * dx
  const py = a.y + t * dy
  return Math.hypot(point.x - px, point.y - py)
}

/** Проверка попадания точки в фигуру по её типу. */
export function pointInShape(point: Point, shape: Shape): boolean {
  switch (shape.type) {
    case 'line': {
      const tolerance = Math.max(4, shape.strokeWidth / 2)
      return (
        pointToSegmentDistance(
          point,
          { x: shape.x1, y: shape.y1 },
          { x: shape.x2, y: shape.y2 },
        ) <= tolerance
      )
    }
    case 'text':
    case 'rect': {
      if (!pointInRect(point, shape)) return false
      return true
    }
    case 'ellipse': {
      if (!pointInRect(point, shape)) return false
      const cx = shape.x + shape.width / 2
      const cy = shape.y + shape.height / 2
      const dx = (point.x - cx) / (shape.width / 2)
      const dy = (point.y - cy) / (shape.height / 2)
      return dx * dx + dy * dy <= 1
    }
  }
}

/** Приблизительный размер текстового слоя по содержимому и размеру шрифта. */
export function estimateTextSize(
  content: string,
  fontSize: number,
): { width: number; height: number } {
  const lines = content.split('\n')
  const longest = Math.max(1, ...lines.map((line) => line.length))
  return {
    width: Math.max(1, Math.ceil(longest * fontSize * 0.62)),
    height: Math.max(fontSize, Math.ceil(lines.length * fontSize * 1.4)),
  }
}

/** Прямоугольник по двум угловым точкам (нормализация к неотрицательным w/h). */
export function rectFromPoints(
  a: Point,
  b: Point,
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

/** Пересекаются ли два прямоугольника (для выделения рамкой). */
export function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}