import type { Shape } from '../types/shape'
import { estimateTextSize } from '../utils/geometry'

interface PropertiesPanelProps {
  selected: Shape | null
  selectionCount: number
  onChange: (patch: Partial<Shape>) => void
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function colorLabel(type: Shape['type']): string {
  if (type === 'line') return 'Stroke'
  if (type === 'text') return 'Text'
  return 'Fill'
}

/** Панель свойств справа: данные выделенной фигуры и её настройки. */
export function PropertiesPanel({ selected, selectionCount, onChange }: PropertiesPanelProps) {
  return (
    <div className="w-60 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Properties
      </h2>
      {selected ? (
        <div className="space-y-2 text-sm text-slate-600">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="font-medium text-slate-800">Type</dt>
              <dd className="capitalize">{selected.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">X</dt>
              <dd>{Math.round(selected.x)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Y</dt>
              <dd>{Math.round(selected.y)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">W</dt>
              <dd>{Math.round(selected.width)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">H</dt>
              <dd>{Math.round(selected.height)}</dd>
            </div>
          </dl>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <dt className="font-medium text-slate-800">{colorLabel(selected.type)}</dt>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selected.fill}
                onChange={(event) => onChange({ fill: event.target.value })}
                className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
              />
              <span className="text-xs tabular-nums text-slate-500">
                {selected.fill}
              </span>
            </div>
          </div>

          {selected.type === 'line' && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <dt className="font-medium text-slate-800">Thickness</dt>
              <input
                type="number"
                min={1}
                max={50}
                value={selected.strokeWidth}
                onChange={(event) =>
                  onChange({
                    strokeWidth: clampNumber(
                      parseFloat(event.target.value),
                      1,
                      50,
                    ),
                  })
                }
                className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-right tabular-nums"
              />
            </div>
          )}

          {selected.type === 'text' && (
            <>
              <div className="border-t border-slate-100 pt-2">
                <dt className="mb-1 font-medium text-slate-800">Content</dt>
                <textarea
                  rows={3}
                  value={selected.content}
                  onChange={(event) =>
                    onChange({
                      content: event.target.value,
                      ...estimateTextSize(event.target.value, selected.fontSize),
                    })
                  }
                  className="w-full resize-y rounded border border-slate-200 px-2 py-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <dt className="font-medium text-slate-800">Font size</dt>
                <input
                  type="number"
                  min={4}
                  max={200}
                  value={selected.fontSize}
                  onChange={(event) => {
                    const fontSize = clampNumber(
                      parseFloat(event.target.value),
                      4,
                      200,
                    )
                    onChange({
                      fontSize,
                      ...estimateTextSize(selected.content, fontSize),
                    })
                  }}
                  className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-right tabular-nums"
                />
              </div>
            </>
          )}
        </div>
      ) : selectionCount > 1 ? (
        <p className="text-sm text-slate-400">{selectionCount} objects selected</p>
      ) : (
        <p className="text-sm text-slate-400">No selection</p>
      )}
    </div>
  )
}