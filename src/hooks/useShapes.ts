import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Point, Shape, ShapeType, TextShape, Tool } from '../types/shape'
import type { Viewport } from '../utils/geometry'
import {
  estimateTextSize,
  pointInShape,
  rectFromPoints,
  rectsIntersect,
  screenToCanvas,
} from '../utils/geometry'

const DEFAULT_FILL = '#3b82f6'
const DEFAULT_TEXT = 'Text'
const DEFAULT_FONT_SIZE = 16
const DEFAULT_LINE_STROKE = 2
const MAX_HISTORY = 100
const PASTE_OFFSET = 24
const CLICK_TOLERANCE = 5

export interface MarqueeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface UseShapesResult {
  shapes: Shape[]
  selectedIds: string[]
  tool: Tool
  setTool: (tool: Tool) => void
  addShape: (shape: Shape) => void
  updateShape: (id: string, patch: Partial<Shape>) => void
  selectShape: (id: string | null) => void
  toggleShape: (id: string) => void
  recordHistory: () => void
  undo: () => void
  redo: () => void
  copySelected: () => void
  paste: () => void
  duplicate: () => void
  deleteSelected: () => void
  draft: Shape | null
  marquee: MarqueeRect | null
  editingId: string | null
  startEditingAt: (point: Point) => void
  updateEditing: (content: string) => void
  commitEditing: () => void
  cancelEditing: () => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: () => void
}

function randomId(): string {
  return crypto.randomUUID()
}

function createShape(
  type: ShapeType,
  x: number,
  y: number,
  width: number,
  height: number,
): Shape {
  const base = {
    id: randomId(),
    x,
    y,
    width,
    height,
    fill: DEFAULT_FILL,
  }
  if (type === 'rect') return { ...base, type: 'rect' }
  if (type === 'ellipse') return { ...base, type: 'ellipse' }
  if (type === 'line') {
    return {
      ...base,
      type: 'line',
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      strokeWidth: DEFAULT_LINE_STROKE,
    }
  }
  const { width: textWidth, height: textHeight } = estimateTextSize(
    DEFAULT_TEXT,
    DEFAULT_FONT_SIZE,
  )
  return {
    ...base,
    type: 'text',
    width: textWidth,
    height: textHeight,
    content: DEFAULT_TEXT,
    fontSize: DEFAULT_FONT_SIZE,
  }
}

/** Копия фигуры со сдвигом и новым id (для копирования и дублирования). */
function cloneShapeWithOffset(shape: Shape, dx: number, dy: number): Shape {
  if (shape.type === 'line') {
    return {
      id: randomId(),
      type: 'line' as const,
      x: shape.x + dx,
      y: shape.y + dy,
      width: shape.width,
      height: shape.height,
      fill: shape.fill,
      x1: shape.x1 + dx,
      y1: shape.y1 + dy,
      x2: shape.x2 + dx,
      y2: shape.y2 + dy,
      strokeWidth: shape.strokeWidth,
    }
  }
  return {
    ...shape,
    id: randomId(),
    x: shape.x + dx,
    y: shape.y + dy,
  } as Shape
}

/** Патч для перемещения фигуры на (dx, dy): для линии двигаются и концы. */
function moveShapePatch(shape: Shape, dx: number, dy: number): Partial<Shape> {
  if (shape.type === 'line') {
    return {
      x: shape.x + dx,
      y: shape.y + dy,
      x1: shape.x1 + dx,
      y1: shape.y1 + dy,
      x2: shape.x2 + dx,
      y2: shape.y2 + dy,
    }
  }
  return { x: shape.x + dx, y: shape.y + dy }
}

/** Поиск верхней фигуры под точкой (итерация сверху вниз по слоям). */
function hitTest(point: Point, shapes: Shape[]): Shape | null {
  for (let index = shapes.length - 1; index >= 0; index--) {
    const shape = shapes[index]
    if (pointInShape(point, shape)) return shape
  }
  return null
}

/**
 * Состояние фигур: список, мультивыделение, добавление, изменение и перетаскивание.
 * Для инструмента select — клик выделяет, Ctrl+клик добавляет/убирает,
 * перетаскивание двигает выделенное, рамка на пустом месте выделяет объекты;
 * для rect/ellipse — рисование фигуры перетаскиванием мыши;
 * для line — рисование отрезка перетаскиванием мыши;
 * для text — клик создаёт текстовый слой и открывает его редактирование.
 */
export function useShapes(viewport: Viewport): UseShapesResult {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tool, setTool] = useState<Tool>('select')
  const [draft, setDraft] = useState<Shape | null>(null)
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const viewportRef = useRef(viewport)
  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  const toolRef = useRef(tool)
  useEffect(() => {
    toolRef.current = tool
  }, [tool])

  const shapesRef = useRef<Shape[]>([])
  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  const selectedIdsRef = useRef<string[]>([])
  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  const editingIdRef = useRef<string | null>(null)
  useEffect(() => {
    editingIdRef.current = editingId
  }, [editingId])

  const historyRef = useRef<Shape[][]>([])
  const futureRef = useRef<Shape[][]>([])
  const clipboardRef = useRef<Shape[]>([])
  const editSnapshotRef = useRef<string>('')
  const dragRecordedRef = useRef(false)

  const startRef = useRef<Point | null>(null)
  const lastPointRef = useRef<Point | null>(null)
  const activeToolRef = useRef<Tool>('select')
  const draftRef = useRef<Shape | null>(null)
  const dragRef = useRef<{
    ids: string[]
    offsets: Record<string, Point>
  } | null>(null)
  const dragCacheRef = useRef<Record<string, Shape>>({})
  const marqueeRef = useRef<Point | null>(null)

  /** Фиксирует текущее состояние фигур как точку отката (браш наполняется до изменения). */
  const recordHistory = useCallback(() => {
    historyRef.current = [
      ...historyRef.current.slice(-(MAX_HISTORY - 1)),
      shapesRef.current,
    ]
    futureRef.current = []
  }, [])

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return
    const previous = historyRef.current[historyRef.current.length - 1]
    historyRef.current = historyRef.current.slice(0, -1)
    futureRef.current = [
      ...futureRef.current.slice(-(MAX_HISTORY - 1)),
      shapesRef.current,
    ]
    setShapes(previous)
  }, [])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current[futureRef.current.length - 1]
    futureRef.current = futureRef.current.slice(0, -1)
    historyRef.current = [
      ...historyRef.current.slice(-(MAX_HISTORY - 1)),
      shapesRef.current,
    ]
    setShapes(next)
  }, [])

  const addShape = useCallback((shape: Shape) => {
    recordHistory()
    setShapes((prev) => [...prev, shape])
  }, [recordHistory])

  const updateShape = useCallback((id: string, patch: Partial<Shape>) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? Object.assign({}, shape, patch) : shape,
      ),
    )
  }, [])

  const selectShape = useCallback((id: string | null) => {
    setSelectedIds(id ? [id] : [])
  }, [])

  const toggleShape = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const copySelected = useCallback(() => {
    const shapes = shapesRef.current
    const selected = new Set(selectedIdsRef.current)
    clipboardRef.current = shapes.filter((shape) => selected.has(shape.id))
  }, [])

  const paste = useCallback(() => {
    if (clipboardRef.current.length === 0) return
    recordHistory()
    const pasted = clipboardRef.current.map((shape) =>
      cloneShapeWithOffset(shape, PASTE_OFFSET, PASTE_OFFSET),
    )
    setShapes((prev) => [...prev, ...pasted])
    setSelectedIds(pasted.map((shape) => shape.id))
  }, [recordHistory])

  const duplicate = useCallback(() => {
    const ids = selectedIdsRef.current
    if (ids.length === 0) return
    recordHistory()
    const idSet = new Set(ids)
    const clones: Shape[] = []
    const next: Shape[] = []
    for (const shape of shapesRef.current) {
      next.push(shape)
      if (idSet.has(shape.id)) {
        const copy = cloneShapeWithOffset(shape, PASTE_OFFSET, PASTE_OFFSET)
        clones.push(copy)
        next.push(copy)
      }
    }
    setShapes(next)
    setSelectedIds(clones.map((shape) => shape.id))
  }, [recordHistory])

  const deleteSelected = useCallback(() => {
    const ids = selectedIdsRef.current
    if (ids.length === 0) return
    recordHistory()
    const idSet = new Set(ids)
    setShapes((prev) => prev.filter((shape) => !idSet.has(shape.id)))
    setSelectedIds([])
  }, [recordHistory])

  const startEditingAt = useCallback((point: Point) => {
    const hit = hitTest(point, shapesRef.current)
    if (hit && hit.type === 'text') {
      editSnapshotRef.current = hit.content
      setSelectedIds([hit.id])
      setEditingId(hit.id)
    }
  }, [])

  const updateEditing = useCallback(
    (content: string) => {
      const id = editingIdRef.current
      if (!id) return
      const shape = shapesRef.current.find((s) => s.id === id)
      if (shape && shape.type === 'text') {
        updateShape(id, { content, ...estimateTextSize(content, shape.fontSize) })
      }
    },
    [updateShape],
  )

  const commitEditing = useCallback(() => {
    setEditingId(null)
  }, [])

  const cancelEditing = useCallback(() => {
    const id = editingIdRef.current
    if (id) {
      const shape = shapesRef.current.find((s) => s.id === id)
      if (shape && shape.type === 'text') {
        updateShape(id, {
          content: editSnapshotRef.current,
          ...estimateTextSize(editSnapshotRef.current, shape.fontSize),
        })
      }
    }
    setEditingId(null)
  }, [updateShape])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      if (editingIdRef.current) return
      if (startRef.current) return
      const activeTool = toolRef.current
      activeToolRef.current = activeTool
      if (activeTool === 'select') {
        const point = screenToCanvas(
          { x: event.clientX, y: event.clientY },
          viewportRef.current,
        )
        const hit = hitTest(point, shapesRef.current)
        if (hit) {
          const additive = event.ctrlKey || event.metaKey
          const current = selectedIdsRef.current
          let idsToDrag: string[]
          if (additive) {
            idsToDrag = current.includes(hit.id)
              ? current.filter((id) => id !== hit.id)
              : [...current, hit.id]
          } else {
            idsToDrag = current.includes(hit.id) ? [...current] : [hit.id]
          }
          if (idsToDrag.length === 0) {
            setSelectedIds([])
            return
          }
          setSelectedIds(idsToDrag)
          const cache: Record<string, Shape> = {}
          const offsets: Record<string, Point> = {}
          for (const id of idsToDrag) {
            const shape = shapesRef.current.find((s) => s.id === id)
            if (shape) {
              cache[id] = shape
              offsets[id] = { x: point.x - shape.x, y: point.y - shape.y }
            }
          }
          dragRef.current = { ids: idsToDrag, offsets }
          dragCacheRef.current = cache
          dragRecordedRef.current = false
          event.currentTarget.setPointerCapture(event.pointerId)
        } else if (event.ctrlKey || event.metaKey) {
          setSelectedIds([])
        } else {
          marqueeRef.current = point
          setMarquee({ x: point.x, y: point.y, width: 0, height: 0 })
          event.currentTarget.setPointerCapture(event.pointerId)
        }
        return
      }
      const start = screenToCanvas(
        { x: event.clientX, y: event.clientY },
        viewportRef.current,
      )
      startRef.current = start
      lastPointRef.current = null
      if (activeTool === 'text') return
      draftRef.current = createShape(activeTool, start.x, start.y, 0, 0)
      setDraft(draftRef.current)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (drag) {
        if (!dragRecordedRef.current) {
          dragRecordedRef.current = true
          recordHistory()
        }
        const point = screenToCanvas(
          { x: event.clientX, y: event.clientY },
          viewportRef.current,
        )
        const updates: Record<string, Partial<Shape>> = {}
        for (const id of drag.ids) {
          const start = dragCacheRef.current[id]
          if (!start) continue
          const dx = point.x - drag.offsets[id].x - start.x
          const dy = point.y - drag.offsets[id].y - start.y
          updates[id] = moveShapePatch(start, dx, dy)
        }
        setShapes((prev) =>
          prev.map((shape) =>
            updates[shape.id] ? Object.assign({}, shape, updates[shape.id]) : shape,
          ),
        )
        return
      }
      const point = screenToCanvas(
        { x: event.clientX, y: event.clientY },
        viewportRef.current,
      )
      lastPointRef.current = point
      if (marqueeRef.current) {
        setMarquee({ ...rectFromPoints(marqueeRef.current, point) })
        return
      }
      const start = startRef.current
      const current = draftRef.current
      if (!start) return
      if (!current) return
      if (current.type === 'line') {
        const draftLine: Shape = {
          ...current,
          x1: start.x,
          y1: start.y,
          x2: point.x,
          y2: point.y,
          ...rectFromPoints(start, point),
        }
        draftRef.current = draftLine
        setDraft(draftLine)
        return
      }
      draftRef.current = { ...current, ...rectFromPoints(start, point) }
      setDraft(draftRef.current)
    },
    [recordHistory],
  )

  const onPointerUp = useCallback(() => {
    if (marqueeRef.current) {
      const start = marqueeRef.current
      const last = lastPointRef.current
      marqueeRef.current = null
      const rect = last ? rectFromPoints(start, last) : { x: start.x, y: start.y, width: 0, height: 0 }
      setMarquee(null)
      if (rect.width <= 1 && rect.height <= 1) {
        setSelectedIds([])
      } else {
        setSelectedIds(
          shapesRef.current
            .filter((shape) => rectsIntersect(rect, shape))
            .map((shape) => shape.id),
        )
      }
      lastPointRef.current = null
      dragRecordedRef.current = false
      return
    }
    dragRef.current = null
    dragCacheRef.current = {}
    const start = startRef.current
    const current = draftRef.current
    startRef.current = null
    lastPointRef.current = null
    draftRef.current = null
    setDraft(null)
    dragRecordedRef.current = false
    if (!start) return
    if (activeToolRef.current === 'text') {
      const last = lastPointRef.current ?? start
      if (Math.hypot(last.x - start.x, last.y - start.y) <= CLICK_TOLERANCE) {
        recordHistory()
        const created = createShape('text', start.x, start.y, 0, 0) as TextShape
        setShapes((prev) => [...prev, created])
        setSelectedIds([created.id])
        editSnapshotRef.current = created.content
        setEditingId(created.id)
      }
      return
    }
    if (!current) return
    if (current.width <= 0 || current.height <= 0) return
    if (current.type === 'line' && Math.hypot(current.x2 - current.x1, current.y2 - current.y1) < 1) {
      return
    }
    recordHistory()
    setShapes((prev) => [...prev, current])
    setSelectedIds([current.id])
  }, [recordHistory])

  return {
    shapes,
    selectedIds,
    tool,
    setTool,
    addShape,
    updateShape,
    selectShape,
    toggleShape,
    recordHistory,
    undo,
    redo,
    copySelected,
    paste,
    duplicate,
    deleteSelected,
    draft,
    marquee,
    editingId,
    startEditingAt,
    updateEditing,
    commitEditing,
    cancelEditing,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}