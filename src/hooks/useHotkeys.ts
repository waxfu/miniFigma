import { useEffect } from 'react'
import { TOOL_BY_KEY } from '../constants/tools'
import type { Tool } from '../types/shape'

export interface UseHotkeysOptions {
  setTool: (tool: Tool) => void
  onUndo?: () => void
  onRedo?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onDeselect?: () => void
}

/** Является ли целью ввода текстовое поле (горячие клавиши не перехватываем). */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

/**
 * Горячие клавиши как в Figma:
 * - V/R/O/L/T — выбор инструмента (см. TOOL_BY_KEY в constants/tools.ts),
 * - Ctrl+Z / Ctrl+Shift+Z (и Ctrl+Y) — undo/redo,
 * - Ctrl+C / Ctrl+V / Ctrl+D — копирование, вставка, дублирование,
 * - Delete/Backspace — удаление, Escape — сброс выделения.
 */
export function useHotkeys({
  setTool,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onDeselect,
}: UseHotkeysOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      const mod = event.ctrlKey || event.metaKey

      if (mod && event.code === 'KeyZ') {
        event.preventDefault()
        if (event.shiftKey) onRedo?.()
        else onUndo?.()
        return
      }
      if (mod && event.code === 'KeyY') {
        event.preventDefault()
        onRedo?.()
        return
      }
      if (mod && event.code === 'KeyC') {
        event.preventDefault()
        onCopy?.()
        return
      }
      if (mod && event.code === 'KeyV') {
        event.preventDefault()
        onPaste?.()
        return
      }
      if (mod && event.code === 'KeyD') {
        event.preventDefault()
        onDuplicate?.()
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        onDelete?.()
        return
      }
      if (event.key === 'Escape') {
        onDeselect?.()
        return
      }
      if (mod || event.altKey) return

      const tool = TOOL_BY_KEY[event.code]
      if (tool) setTool(tool)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onUndo, onRedo, onCopy, onPaste, onDuplicate, onDelete, onDeselect, setTool])
}