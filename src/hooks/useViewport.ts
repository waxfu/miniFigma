import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Point } from '../types/shape'
import { clampZoom } from '../utils/geometry'
import type { Viewport } from '../utils/geometry'

export type { Viewport } from '../utils/geometry'

const ZOOM_STEP = 1.1

export interface UseViewportResult {
  viewport: Viewport
  cursor: 'grab' | 'grabbing' | 'default'
  spaceHeld: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: () => void
  zoomAt: (clientX: number, clientY: number, deltaY: number) => void
}

/**
 * Камера канваса:
 * - панорамирование при зажатом пробеле + мышь,
 * - зум колесом от 10% до 400% с центрированием на курсоре,
 * - центр координат в середине экрана при старте.
 */
export function useViewport(): UseViewportResult {
  const [viewport, setViewport] = useState<Viewport>(() => ({
    offsetX: window.innerWidth / 2,
    offsetY: window.innerHeight / 2,
    zoom: 1,
  }))
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [panning, setPanning] = useState(false)

  const viewportRef = useRef(viewport)
  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  const spaceRef = useRef(false)
  const panningRef = useRef(false)
  const panStartRef = useRef<Point>({ x: 0, y: 0 })
  const panOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      if (!spaceRef.current) {
        spaceRef.current = true
        setSpaceHeld(true)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      spaceRef.current = false
      setSpaceHeld(false)
      stopPanning()
    }
    const handleBlur = () => {
      spaceRef.current = false
      setSpaceHeld(false)
      stopPanning()
    }

    function stopPanning() {
      panningRef.current = false
      setPanning(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!spaceRef.current) return
    panningRef.current = true
    setPanning(true)
    panStartRef.current = { x: event.clientX, y: event.clientY }
    panOffsetRef.current = { x: viewportRef.current.offsetX, y: viewportRef.current.offsetY }
  }, [])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panningRef.current) return
    const dx = event.clientX - panStartRef.current.x
    const dy = event.clientY - panStartRef.current.y
    setViewport((prev) => ({
      ...prev,
      offsetX: panOffsetRef.current.x + dx,
      offsetY: panOffsetRef.current.y + dy,
    }))
  }, [])

  const onPointerUp = useCallback(() => {
    panningRef.current = false
    setPanning(false)
  }, [])

  const zoomAt = useCallback((clientX: number, clientY: number, deltaY: number) => {
    setViewport((prev) => {
      const factor = deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      const zoom = clampZoom(prev.zoom * factor)
      const canvasX = (clientX - prev.offsetX) / prev.zoom
      const canvasY = (clientY - prev.offsetY) / prev.zoom
      return {
        zoom,
        offsetX: clientX - canvasX * zoom,
        offsetY: clientY - canvasY * zoom,
      }
    })
  }, [])

  const cursor = spaceHeld ? (panning ? 'grabbing' : 'grab') : 'default'

  return { viewport, cursor, spaceHeld, onPointerDown, onPointerMove, onPointerUp, zoomAt }
}