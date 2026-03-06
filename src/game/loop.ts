import { GameState, TICK_MS, Vec2, placeFood, cellKey } from './state'
import { isWall, isOccupied } from './collision'
import { dequeue } from './input'
import { autopilotMove } from './autopilot/survival'

type Callback = () => void
type ScoreCallback = (score: number, highScore: number) => void

let rafId: number | null = null
let lastTime = 0
let accumulator = 0

export function startLoop(
  state: GameState,
  onGameOver: Callback,
  onScore: ScoreCallback,
  renderFn: Callback,
): void {
  stopLoop()
  lastTime = performance.now()
  accumulator = 0

  function tick(timestamp: number): void {
    // Cap delta to avoid spiral-of-death after tab switch
    const delta = Math.min(timestamp - lastTime, 250)
    lastTime = timestamp
    accumulator += delta

    while (accumulator >= TICK_MS) {
      accumulator -= TICK_MS
      if (state.running && !state.paused) {
        update(state, onGameOver, onScore)
        if (!state.running) break
      }
    }

    renderFn()
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

export function stopLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function update(
  state: GameState,
  onGameOver: Callback,
  onScore: ScoreCallback,
): void {
  // Determine next direction
  if (state.autopilot) {
    state.dir = autopilotMove(state.snake, state.food, state.dir)
  } else {
    const input = dequeue()
    if (input) state.dir = input
  }

  const head: Vec2 = {
    x: state.snake[0].x + state.dir.x,
    y: state.snake[0].y + state.dir.y,
  }

  // Collision
  if (isWall(head.x, head.y) || isOccupied(state.occupiedCells, head.x, head.y)) {
    state.running = false
    onGameOver()
    return
  }

  // Advance snake
  state.snake.unshift(head)
  state.occupiedCells.add(cellKey(head.x, head.y))

  if (head.x === state.food.x && head.y === state.food.y) {
    state.score++
    if (state.score > state.highScore) {
      state.highScore = state.score
      localStorage.setItem('snakeHS', String(state.highScore))
    }
    placeFood(state)
    onScore(state.score, state.highScore)
  } else {
    const tail = state.snake.pop()!
    state.occupiedCells.delete(cellKey(tail.x, tail.y))
  }
}
