import type { ShapeType, Tool } from '../types/shape'

export interface ToolDefinition {
  id: Tool
  label: string
  shortcutLabel: string
}

export const TOOLS: ToolDefinition[] = [
  { id: 'select', label: 'Select', shortcutLabel: 'V' },
  { id: 'rect', label: 'Rectangle', shortcutLabel: 'R' },
  { id: 'ellipse', label: 'Ellipse', shortcutLabel: 'O' },
  { id: 'line', label: 'Line', shortcutLabel: 'L' },
  { id: 'text', label: 'Text', shortcutLabel: 'T' },
]

/** Соответствие физических клавиш (event.code) инструментам. */
export const TOOL_BY_KEY: Record<string, Tool> = {
  KeyV: 'select',
  KeyR: 'rect',
  KeyO: 'ellipse',
  KeyL: 'line',
  KeyT: 'text',
}

/** Список типов фигур для выпадающих списков и панели слоёв. */
export const SHAPE_TYPES: ShapeType[] = ['rect', 'ellipse', 'line', 'text']