import { TetrisState, COLS, ROWS, CELL, PANEL_X, SHAPES, COLORS } from './state'
import { ghostY } from './update'

const BG_COL    = '#0d0d14'
const GRID_COL  = '#1a1a28'
const ACCENT    = '#39d98a'
const MUTED     = '#4a4a6a'
const PANEL_W   = 500 - PANEL_X  // 230px

export function renderTetris(ctx: CanvasRenderingContext2D, state: TetrisState): void {
  const W = ctx.canvas.width, H = ctx.canvas.height

  // ── Background ───────────────────────────────────────────────────────────
  ctx.fillStyle = BG_COL
  ctx.fillRect(0, 0, W, H)

  // Grid lines
  ctx.strokeStyle = GRID_COL
  ctx.lineWidth = 0.5
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke()
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke()
  }

  // Separator
  ctx.strokeStyle = '#1e1e30'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PANEL_X - 5, 0); ctx.lineTo(PANEL_X - 5, H); ctx.stroke()

  // ── Board ────────────────────────────────────────────────────────────────
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const col = state.board[r][c]
      if (col) drawCell(ctx, c, r, col, 1)
    }
  }

  // ── Ghost piece ──────────────────────────────────────────────────────────
  if (state.running && !state.gameOver) {
    const gy  = ghostY(state.board, state.current)
    const col = COLORS[state.current.type]
    for (const [cx, cy] of SHAPES[state.current.type][state.current.rotation]) {
      const gr = gy + cy, gc = state.current.x + cx
      if (gr >= 0 && gr < ROWS) drawCell(ctx, gc, gr, col, 0.18)
    }
  }

  // ── Current piece ────────────────────────────────────────────────────────
  if (state.running && !state.gameOver) {
    const col = COLORS[state.current.type]
    ctx.shadowColor = col
    ctx.shadowBlur  = 8
    for (const [cx, cy] of SHAPES[state.current.type][state.current.rotation]) {
      const gr = state.current.y + cy, gc = state.current.x + cx
      if (gr >= 0 && gr < ROWS) drawCell(ctx, gc, gr, col, 1)
    }
    ctx.shadowBlur = 0
  }

  // ── Paused overlay ───────────────────────────────────────────────────────
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
    ctx.fillStyle   = ACCENT
    ctx.font        = "bold 1.6rem 'Orbitron', sans-serif"
    ctx.textAlign   = 'center'
    ctx.fillText('PAUSA', (COLS * CELL) / 2, (ROWS * CELL) / 2)
    ctx.textAlign = 'left'
  }

  // ── Side panel ───────────────────────────────────────────────────────────
  drawPanel(ctx, state, PANEL_X, H)
}

function drawCell(ctx: CanvasRenderingContext2D, c: number, r: number, color: string, alpha: number): void {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2, 2)
  ctx.fill()
  // Inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, 4)
  ctx.globalAlpha = 1
}

function drawPanel(ctx: CanvasRenderingContext2D, state: TetrisState, px: number, H: number): void {
  // Background
  ctx.fillStyle = '#0b0b12'
  ctx.fillRect(px, 0, PANEL_W, H)

  const lbl = (text: string, x: number, y: number) => {
    ctx.fillStyle   = '#4a4a6a'
    ctx.font        = "600 .58rem 'Orbitron', sans-serif"
    ctx.letterSpacing = '3px'
    ctx.fillText(text, x, y)
    ctx.letterSpacing = '0px'
  }

  const val = (text: string, x: number, y: number, color = ACCENT) => {
    ctx.fillStyle = color
    ctx.font      = "700 1.1rem 'Orbitron', sans-serif"
    ctx.fillText(text, x, y)
  }

  // NEXT
  lbl('NEXT', px + 20, 36)
  const nextCells = SHAPES[state.next.type][0]
  const col       = COLORS[state.next.type]
  const previewSz = 18
  const previewX  = px + 20
  const previewY  = 50
  ctx.fillStyle   = '#111122'
  ctx.fillRect(previewX, previewY, previewSz * 4, previewSz * 3)
  ctx.fillStyle = col
  ctx.shadowColor = col; ctx.shadowBlur = 6
  for (const [cx, cy] of nextCells) {
    if (cy > 2) continue
    ctx.beginPath()
    ctx.roundRect(previewX + cx * previewSz + 1, previewY + cy * previewSz + 1, previewSz - 2, previewSz - 2, 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // LEVEL
  lbl('LEVEL', px + 20, 138)
  val(String(state.level), px + 20, 162)

  // LINES
  lbl('LINES', px + 20, 192)
  val(String(state.lines), px + 20, 216)
}
