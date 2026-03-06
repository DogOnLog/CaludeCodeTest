import { BreakoutState, W, H, PADDLE_H, PADDLE_Y, BALL_R, BRICK_W, BRICK_H, ROW_COLORS } from './state'

const BG_COL      = '#0d0d14'
const DOT_COL     = '#1a1a28'
const ACCENT      = '#39d98a'
const ACCENT_AUTO = '#22d3ee'

let bgCache: HTMLCanvasElement | null = null

function getBackground(): HTMLCanvasElement {
  if (bgCache) return bgCache
  bgCache = document.createElement('canvas')
  bgCache.width = W; bgCache.height = H
  const bx = bgCache.getContext('2d')!
  bx.fillStyle = BG_COL
  bx.fillRect(0, 0, W, H)
  bx.fillStyle = DOT_COL
  for (let x = 25; x < W; x += 25)
    for (let y = 25; y < H; y += 25)
      bx.fillRect(x - 1, y - 1, 2, 2)
  return bgCache
}

export function renderBreakout(ctx: CanvasRenderingContext2D, state: BreakoutState): void {
  ctx.drawImage(getBackground(), 0, 0)

  // Bricks
  for (const brick of state.bricks) {
    if (!brick.alive) continue
    ctx.fillStyle   = ROW_COLORS[brick.row]
    ctx.shadowColor = ROW_COLORS[brick.row]
    ctx.shadowBlur  = 5
    ctx.beginPath()
    ctx.roundRect(brick.x + 1, brick.y + 1, BRICK_W - 2, BRICK_H - 2, 3)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // Paddle
  const padCol = state.autopilot ? ACCENT_AUTO : ACCENT
  ctx.fillStyle   = padCol
  ctx.shadowColor = padCol
  ctx.shadowBlur  = 12
  ctx.beginPath()
  ctx.roundRect(state.paddleX, PADDLE_Y, state.paddleW, PADDLE_H, 5)
  ctx.fill()
  ctx.shadowBlur = 0

  // Ball
  ctx.fillStyle   = '#ffffff'
  ctx.shadowColor = '#ddddff'
  ctx.shadowBlur  = 12
  ctx.beginPath()
  ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Lives (dots at bottom centre)
  for (let i = 0; i < 3; i++) {
    const alive = i < state.lives
    ctx.fillStyle   = alive ? '#ff4d4d' : '#1e1e30'
    ctx.shadowColor = alive ? '#ff4d4d' : 'transparent'
    ctx.shadowBlur  = alive ? 8 : 0
    ctx.beginPath()
    ctx.arc(W / 2 + (i - 1) * 18, H - 12, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // Paused overlay
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = ACCENT
    ctx.font = "bold 1.8rem 'Orbitron', sans-serif"
    ctx.textAlign = 'center'
    ctx.fillText('PAUSA', W / 2, H / 2)
    ctx.textAlign = 'left'
  }
}
