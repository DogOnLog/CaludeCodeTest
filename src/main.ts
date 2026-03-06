import './styles/main.css'
import './styles/portfolio.css'
import { createInitialState, GameState } from './game/state'
import { startLoop, stopLoop } from './game/loop'
import { enqueue, clearQueue } from './game/input'
import { render } from './game/renderer'
import { getOverlayEls, showStart, showGameOver, hideOverlay } from './ui/overlay'
import { getHudEls, updateScore, updateHighScore, setAutopilot } from './ui/hud'

// ── DOM ──────────────────────────────────────────────────────────────────────
const canvas  = document.getElementById('canvas') as HTMLCanvasElement
const ctx     = canvas.getContext('2d')!
const overlay = getOverlayEls()
const hud     = getHudEls()

// ── State ────────────────────────────────────────────────────────────────────
let state: GameState = createInitialState()
updateHighScore(hud.highScore, state.highScore)

// ── Game lifecycle ────────────────────────────────────────────────────────────
function startGame(): void {
  state = createInitialState()
  state.running = true
  updateScore(hud.score, 0)
  updateHighScore(hud.highScore, state.highScore)
  setAutopilot(hud.autoBtn, false)
  clearQueue()
  hideOverlay(overlay)

  startLoop(
    state,
    () => {                                           // onGameOver
      stopLoop()
      const isRecord = state.score > 0 && state.score >= state.highScore
      showGameOver(overlay, state.score, isRecord)
    },
    (score, highScore) => {                           // onScore
      updateScore(hud.score, score)
      updateHighScore(hud.highScore, highScore)
    },
    () => render(ctx, state),                         // renderFn
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
const KEY_DIR: Record<string, { x: number; y: number }> = {
  ArrowUp:    { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
  ArrowDown:  { x: 0, y:  1 }, s: { x: 0, y:  1 }, S: { x: 0, y:  1 },
  ArrowLeft:  { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
  ArrowRight: { x:  1, y: 0 }, d: { x:  1, y: 0 }, D: { x:  1, y: 0 },
}

document.addEventListener('keydown', (e) => {
  const dir = KEY_DIR[e.key]
  if (dir && state.running && !state.paused && !state.autopilot) {
    enqueue(dir, state.dir)
    if (e.key.startsWith('Arrow')) e.preventDefault()
  }
  if ((e.key === 'p' || e.key === 'P') && state.running) {
    state.paused = !state.paused
  }
})

// Swipe gestures
let touchStart: { x: number; y: number } | null = null

document.addEventListener('touchstart', (e) => {
  const t = e.touches[0]
  touchStart = { x: t.clientX, y: t.clientY }
}, { passive: true })

document.addEventListener('touchend', (e) => {
  if (!touchStart || !state.running || state.paused || state.autopilot) return
  const t  = e.changedTouches[0]
  const dx = t.clientX - touchStart.x
  const dy = t.clientY - touchStart.y
  touchStart = null
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
  const dir = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 })
    : (dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 })
  enqueue(dir, state.dir)
}, { passive: true })

// D-pad
const dpadMap: [string, { x: number; y: number }][] = [
  ['d-up',    { x: 0, y: -1 }],
  ['d-down',  { x: 0, y:  1 }],
  ['d-left',  { x: -1, y: 0 }],
  ['d-right', { x:  1, y: 0 }],
]
dpadMap.forEach(([id, dir]) => {
  document.getElementById(id)?.addEventListener('click', () => {
    if (state.running && !state.paused && !state.autopilot) {
      enqueue(dir, state.dir)
    }
  })
})

// ── UI events ─────────────────────────────────────────────────────────────────
overlay.btn.addEventListener('click', startGame)

hud.autoBtn.addEventListener('click', () => {
  if (!state.running) return
  state.autopilot = !state.autopilot
  setAutopilot(hud.autoBtn, state.autopilot)
})

// Auto-pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.running) state.paused = true
})

// ── Initial render ────────────────────────────────────────────────────────────
showStart(overlay)
render(ctx, state)
