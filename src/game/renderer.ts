import { GameState, GRID, COLS, ROWS } from './state'

const ACCENT   = '#39d98a'
const ACCENT_AUTO = '#22d3ee'
const FOOD_COL = '#ff4d4d'
const BG_COL   = '#0d0d14'
const DOT_COL  = '#1a1a28'

// Off-screen canvas for the static grid background — drawn once
let bgCache: HTMLCanvasElement | null = null

function getBackground(width: number, height: number): HTMLCanvasElement {
  if (bgCache) return bgCache
  bgCache = document.createElement('canvas')
  bgCache.width = width
  bgCache.height = height
  const bctx = bgCache.getContext('2d')!
  bctx.fillStyle = BG_COL
  bctx.fillRect(0, 0, width, height)
  bctx.fillStyle = DOT_COL
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      bctx.fillRect(x * GRID + GRID / 2 - 1, y * GRID + GRID / 2 - 1, 2, 2)
    }
  }
  return bgCache
}

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { width, height } = ctx.canvas

  // Composite static background
  ctx.drawImage(getBackground(width, height), 0, 0)

  // Food
  const fx = state.food.x * GRID
  const fy = state.food.y * GRID
  ctx.fillStyle = FOOD_COL
  ctx.shadowColor = FOOD_COL
  ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.arc(fx + GRID / 2, fy + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Snake
  const headColor = state.autopilot ? ACCENT_AUTO : ACCENT
  state.snake.forEach((seg, i) => {
    const ratio = 1 - i / state.snake.length
    if (i === 0) {
      ctx.fillStyle = headColor
      ctx.shadowColor = headColor
      ctx.shadowBlur = 12
    } else {
      ctx.fillStyle = state.autopilot
        ? `hsl(192, 60%, ${20 + ratio * 30}%)`
        : `hsl(161, 60%, ${20 + ratio * 30}%)`
      ctx.shadowBlur = 0
    }
    const pad = i === 0 ? 1 : 2
    ctx.beginPath()
    ctx.roundRect(
      seg.x * GRID + pad,
      seg.y * GRID + pad,
      GRID - pad * 2,
      GRID - pad * 2,
      i === 0 ? 5 : 3,
    )
    ctx.fill()
  })
  ctx.shadowBlur = 0

  // Paused overlay
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = ACCENT
    ctx.font = "bold 1.8rem 'Orbitron', sans-serif"
    ctx.textAlign = 'center'
    ctx.fillText('PAUSA', width / 2, height / 2)
    ctx.textAlign = 'left'
  }
}
