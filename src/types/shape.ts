/** Точка в координатах канваса или экрана. */
export interface Point {
  x: number
  y: number
}

/** Тип геометрической фигуры. */
export type ShapeType = 'rect' | 'ellipse' | 'line' | 'text'

/** Инструмент, выбранный в панели слева. */
export type Tool = 'select' | 'rect' | 'ellipse' | 'line' | 'text'

/** Общая часть любой фигуры. */
export interface ShapeBase {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
}

export interface RectShape extends ShapeBase {
  type: 'rect'
}

export interface EllipseShape extends ShapeBase {
  type: 'ellipse'
}

/** Линия: отрезок между (x1,y1) и (x2,y2); x/y/w/h — ограничивающий бокс. */
export interface LineShape extends ShapeBase {
  type: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
  strokeWidth: number
}

/** Текстовый слой: содержимое, размер шрифта; цвет — fill. */
export interface TextShape extends ShapeBase {
  type: 'text'
  content: string
  fontSize: number
}

/** Фигура на канвасе: прямоугольник, эллипс, линия или текст. */
export type Shape = RectShape | EllipseShape | LineShape | TextShape