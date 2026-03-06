import { Vec2, COLS, ROWS, cellKey } from '../state'

const MOVES: Vec2[] = [
  { x: 0, y: -1 },
  { x: 0, y:  1 },
  { x: -1, y: 0 },
  { x:  1, y: 0 },
]

export function bfs(start: Vec2, target: Vec2, blocked: Set<string>): Vec2[] | null {
  const queue: { pos: Vec2; path: Vec2[] }[] = [{ pos: start, path: [] }]
  const visited = new Set<string>([cellKey(start.x, start.y)])

  while (queue.length > 0) {
    const item = queue.shift()!
    for (const m of MOVES) {
      const nx = item.pos.x + m.x
      const ny = item.pos.y + m.y
      const key = cellKey(nx, ny)
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue
      if (blocked.has(key) || visited.has(key)) continue
      const newPath = [...item.path, m]
      if (nx === target.x && ny === target.y) return newPath
      visited.add(key)
      queue.push({ pos: { x: nx, y: ny }, path: newPath })
    }
  }
  return null
}
