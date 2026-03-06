import { COLS, ROWS, cellKey } from './state'

export function isWall(x: number, y: number): boolean {
  return x < 0 || x >= COLS || y < 0 || y >= ROWS
}

export function isOccupied(cells: Set<string>, x: number, y: number): boolean {
  return cells.has(cellKey(x, y))
}
