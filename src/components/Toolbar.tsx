import { TOOLS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  tool: Tool
  onSelectTool: (tool: Tool) => void
}

const TOOL_ICONS: Record<Tool, string> = {
  select: '✧',
  rect: '▭',
  ellipse: '◯',
  line: '╱',
  text: 'T',
}

/** Панель инструментов слева. Пока каркас: кнопки из TOOLS. */
export function Toolbar({ tool, onSelectTool }: ToolbarProps) {
  return (
    <div className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/90 p-1.5 shadow-lg backdrop-blur">
      {TOOLS.map((item) => {
        const active = item.id === tool
        return (
          <button
            key={item.id}
            type="button"
            title={`${item.label} — ${item.shortcutLabel}`}
            onClick={() => onSelectTool(item.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors ${
              active
                ? 'bg-blue-500 text-white'
                : 'text-zinc-400 hover:bg-zinc-700/70 hover:text-zinc-200'
            }`}
          >
            {TOOL_ICONS[item.id]}
          </button>
        )
      })}
    </div>
  )
}