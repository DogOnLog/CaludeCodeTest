import { Vec2, cellKey, COLS, ROWS } from '../state'
import { bfs } from './bfs'

const MOVES: Vec2[] = [
  { x: 0, y: -1 },
  { x: 0, y:  1 },
  { x: -1, y: 0 },
  { x:  1, y: 0 },
]

// Last computed path exposed for path-preview rendering
let _lastPath: Vec2[] = []
export function getAutopilotPath(): Vec2[] { return _lastPath }

/**
 * Simulate eating the food at (head+move), then verify the tail is still
 * reachable from the new head. This prevents the snake from trapping itself.
 */
function isSafeToEat(snake: Vec2[], move: Vec2): boolean {
  const newHead = { x: snake[0].x + move.x, y: snake[0].y + move.y }
  // After eating, the snake grows: body stays, head is added
  const newSnake = [newHead, ...snake]
  const blocked = new Set(newSnake.slice(1).map(s => cellKey(s.x, s.y)))
  const tail = newSnake[newSnake.length - 1]
  return bfs(newHead, tail, blocked) !== null
}

export function autopilotMove(snake: Vec2[], food: Vec2, currentDir: Vec2): Vec2 {
  const head = snake[0]
  const blocked = new Set(snake.map(s => cellKey(s.x, s.y)))

  // 1. Try safe path to food
  const pathToFood = bfs(head, food, blocked)
  if (pathToFood && pathToFood.length > 0) {
    const move = pathToFood[0]
    if (isSafeToEat(snake, move)) {
      _lastPath = pathToFood
      return move
    }
  }

  // 2. Chase tail to survive when no safe path to food
  const tail = snake[snake.length - 1]
  const pathToTail = bfs(head, tail, blocked)
  if (pathToTail && pathToTail.length > 0) {
    _lastPath = pathToTail
    return pathToTail[0]
  }

  // 3. Last resort: any free adjacent cell
  _lastPath = []
  for (const m of MOVES) {
    if (m.x === -currentDir.x && m.y === -currentDir.y) continue
    const nx = head.x + m.x
    const ny = head.y + m.y
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !blocked.has(cellKey(nx, ny))) {
      return m
    }
  }

  return currentDir
}
