import type { PointerEvent as ReactPointerEvent } from 'react'
import { Canvas } from './components/Canvas'
import { LayersPanel } from './components/LayersPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { useHotkeys } from './hooks/useHotkeys'
import { useShapes } from './hooks/useShapes'
import { useViewport } from './hooks/useViewport'

export default function App() {
  const {
    viewport,
    cursor,
    spaceHeld,
    onPointerDown: onViewportPointerDown,
    onPointerMove: onViewportPointerMove,
    onPointerUp: onViewportPointerUp,
    zoomAt,
  } = useViewport()
  const {
    shapes,
    selectedIds,
    tool,
    setTool,
    selectShape,
    toggleShape,
    updateShape,
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
    onPointerDown: onShapesPointerDown,
    onPointerMove: onShapesPointerMove,
    onPointerUp: onShapesPointerUp,
  } = useShapes(viewport)
  useHotkeys({
    setTool,
    onUndo: undo,
    onRedo: redo,
    onCopy: copySelected,
    onPaste: paste,
    onDuplicate: duplicate,
    onDelete: deleteSelected,
    onDeselect: () => selectShape(null),
  })

  const selectedShapes = shapes.filter((shape) => selectedIds.includes(shape.id))
  const active = selectedShapes.length === 1 ? selectedShapes[0] : null

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onViewportPointerDown(event)
    if (!spaceHeld) onShapesPointerDown(event)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    onViewportPointerMove(event)
    onShapesPointerMove(event)
  }

  const handlePointerUp = () => {
    onViewportPointerUp()
    onShapesPointerUp()
  }

  const canvasCursor =
    cursor === 'default' && tool !== 'select'
      ? tool === 'text'
        ? 'text'
        : 'crosshair'
      : cursor

  return (
    <div className="fixed inset-0 overflow-hidden bg-zinc-900 text-zinc-100">
      <Canvas
        viewport={viewport}
        cursor={canvasCursor}
        shapes={shapes}
        draft={draft}
        selectedIds={selectedIds}
        marquee={marquee}
        editingId={editingId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        zoomAt={zoomAt}
        onEditContent={updateEditing}
        onCommitEdit={commitEditing}
        onCancelEdit={cancelEditing}
        onStartEdit={startEditingAt}
      />

      <Toolbar tool={tool} onSelectTool={setTool} />

      <div className="pointer-events-none absolute inset-y-0 right-3 flex flex-col gap-3 py-3">
        <div className="pointer-events-auto">
          <PropertiesPanel
            selected={active}
            selectionCount={selectedShapes.length}
            onChange={(patch) => {
              if (active) {
                recordHistory()
                updateShape(active.id, patch)
              }
            }}
          />
        </div>
        <div className="pointer-events-auto min-h-0 flex-1">
          <LayersPanel
            shapes={shapes}
            selectedIds={selectedIds}
            onSelect={(id, additive) => {
              if (additive) toggleShape(id)
              else selectShape(id)
            }}
          />
        </div>
      </div>
    </div>
  )
}