import type { Shape } from '../types/shape'

interface LayersPanelProps {
  shapes: Shape[]
  selectedIds: string[]
  onSelect: (id: string, additive: boolean) => void
}

/** Панель слоёв справа: список фигур. Клик выделяет, Ctrl+клик добавляет/убирает. */
export function LayersPanel({ shapes, selectedIds, onSelect }: LayersPanelProps) {
  return (
    <div className="flex h-full min-h-0 w-60 flex-col rounded-xl border border-zinc-700 bg-zinc-800/90 p-4 shadow-lg backdrop-blur">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Layers
      </h2>
      {shapes.length === 0 ? (
        <p className="text-sm text-zinc-500">No layers yet</p>
      ) : (
        <ul className="space-y-1 overflow-auto">
          {shapes.map((shape) => {
            const active = selectedIds.includes(shape.id)
            return (
              <li key={shape.id}>
                <button
                  type="button"
                  onClick={(event) =>
                    onSelect(shape.id, event.ctrlKey || event.metaKey)
                  }
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-blue-500/15 text-blue-300'
                      : 'text-zinc-400 hover:bg-zinc-700/70 hover:text-zinc-200'
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-zinc-600"
                    style={{ backgroundColor: shape.fill }}
                  />
                  <span className="truncate text-xs tabular-nums">
                    {shape.type === 'text' ? shape.content : shape.type}
                  </span>
                  <span>{shape.id.slice(0, 5)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}