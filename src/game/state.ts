export const GRID = 20
export const COLS = 20
export const ROWS = 20
export const TICK_MS = 120

export interface Vec2 {
  x: number
  y: number
}

export interface GameState {
  snake: Vec2[]
  occupiedCells: Set<string>
  dir: Vec2
  food: Vec2
  score: number
  highScore: number
  running: boolean
  paused: boolean
  autopilot: boolean
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

export function createInitialState(): GameState {
  const snake: Vec2[] = [
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 },
  ]
  const occupiedCells = new Set(snake.map(s => cellKey(s.x, s.y)))
  const highScore = parseInt(localStorage.getItem('snakeHS') ?? '0')

  const state: GameState = {
    snake,
    occupiedCells,
    dir: { x: 1, y: 0 },
    food: { x: 0, y: 0 },
    score: 0,
    highScore,
    running: false,
    paused: false,
    autopilot: false,
  }
  placeFood(state)
  return state
}

export function placeFood(state: GameState): void {
  let x: number, y: number
  do {
    x = Math.floor(Math.random() * COLS)
    y = Math.floor(Math.random() * ROWS)
  } while (state.occupiedCells.has(cellKey(x, y)))
  state.food = { x, y }
}
