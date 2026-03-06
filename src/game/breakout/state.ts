export const W            = 500
export const H            = 500
export const PADDLE_H     = 10
export const PADDLE_Y     = 455
export const PADDLE_SPEED = 6
export const BALL_R       = 7
export const BRICK_COLS   = 8
export const BRICK_ROWS   = 5
export const BRICK_W      = 52
export const BRICK_H      = 18
export const BRICK_GAP    = 5
export const BRICK_TOP    = 65

const totalBrickW = BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP
export const BRICK_LEFT = (W - totalBrickW) / 2

export const ROW_COLORS = ['#ff4d4d', '#ff8c42', '#ffd700', '#39d98a', '#22d3ee']
export const ROW_POINTS = [5, 4, 3, 2, 1]

export interface Brick {
  x: number; y: number; row: number; alive: boolean
}

export interface BreakoutState {
  paddleX:   number
  paddleW:   number
  ball:      { x: number; y: number; vx: number; vy: number }
  bricks:    Brick[]
  score:     number
  highScore: number
  lives:     number
  running:   boolean
  paused:    boolean
  autopilot: boolean
  won:       boolean
}

function makeBricks(): Brick[] {
  const bricks: Brick[] = []
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      bricks.push({
        x: BRICK_LEFT + c * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP  + r * (BRICK_H + BRICK_GAP),
        row: r, alive: true,
      })
  return bricks
}

export function resetBall(state: BreakoutState): void {
  state.ball    = { x: W / 2, y: PADDLE_Y - BALL_R - 2, vx: 2.5, vy: -3.5 }
  state.paddleX = W / 2 - state.paddleW / 2
}

export function createBreakoutState(): BreakoutState {
  const highScore = parseInt(localStorage.getItem('breakoutHS') ?? '0')
  const state: BreakoutState = {
    paddleX: W / 2 - 45, paddleW: 90,
    ball:    { x: W / 2, y: PADDLE_Y - BALL_R - 2, vx: 2.5, vy: -3.5 },
    bricks:  makeBricks(),
    score: 0, highScore, lives: 3,
    running: false, paused: false, autopilot: false, won: false,
  }
  return state
}
