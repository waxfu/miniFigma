import { useEffect, useRef } from 'react'
import type { TextShape } from '../types/shape'

interface TextEditorProps {
  shape: TextShape
  onContentChange: (content: string) => void
  onCommit: () => void
  onCancel: () => void
}

/** Редактирование текста прямо на канвасе: Enter — применить, Esc — отменить. */
export function TextEditor({ shape, onContentChange, onCommit, onCancel }: TextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const element = ref.current
    if (element) {
      element.focus()
      const length = element.value.length
      element.setSelectionRange(length, length)
    }
  }, [])

  return (
    <textarea
      ref={ref}
      value={shape.content}
      onChange={(event) => onContentChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        } else if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onCommit()
        }
      }}
      style={{
        position: 'absolute',
        left: shape.x,
        top: shape.y,
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        resize: 'none',
        overflow: 'hidden',
        color: shape.fill,
        fontFamily: 'inherit',
        fontSize: shape.fontSize,
        lineHeight: 1.4,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        minWidth: shape.width,
        minHeight: shape.height,
        width: shape.width,
        height: shape.height,
      }}
    />
  )
}