import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/game.css'

import { createInitialState, GameState } from './game/state'
import { startLoop, stopLoop } from './game/loop'
import { enqueue, clearQueue } from './game/input'
import { render } from './game/renderer'
import { triggerShake, playDeathAnimation, showMilestone } from './game/effects'
import { playEat, playDeath, playMilestone, setAudioEnabled, isAudioEnabled } from './game/audio'
import { getOverlayEls, showStart, showGameOver, hideOverlay, renderLeaderboard } from './ui/overlay'
import { getHudEls, updateScore, updateHighScore, setAutopilot, setRecordGlow } from './ui/hud'
import { submitScore, fetchTop } from './lib/leaderboard'

// ── DOM ───────────────────────────────────────────────────────────────────────
const canvas      = document.getElementById('canvas') as HTMLCanvasElement
const ctx         = canvas.getContext('2d')!
const gameWrapper = document.getElementById('game-wrapper') as HTMLElement
const milestoneEl = document.getElementById('milestone') as HTMLElement
const audioBtn    = document.getElementById('audio-btn') as HTMLButtonElement | null
const crtBtn      = document.getElementById('crt-btn')   as HTMLButtonElement | null
const overlay     = getOverlayEls()
const hud         = getHudEls()

// ── State ─────────────────────────────────────────────────────────────────────
let state: GameState = createInitialState()
updateHighScore(hud.highScore, state.highScore)

// ── Idle demo (AI plays in background on start/game-over screen) ──────────────
function startIdleDemo(): void {
  const demo = createInitialState()
  demo.running  = true
  demo.autopilot = true
  startLoop(
    demo,
    () => {
      // Demo snake died — reset in-place so the loop keeps running
      const fresh = createInitialState()
      Object.assign(demo, fresh)
      demo.running   = true
      demo.autopilot = true
    },
    () => {},
    () => render(ctx, demo),
  )
}

// ── Game lifecycle ─────────────────────────────────────────────────────────────
function startGame(): void {
  state = createInitialState()
  state.running = true
  updateScore(hud.score, 0)
  updateHighScore(hud.highScore, state.highScore)
  setRecordGlow(hud.highScoreCard, false)
  setAutopilot(hud.autoBtn, hud.aiBadge, false)
  clearQueue()
  hideOverlay(overlay)

  startLoop(
    state,
    () => {                                                   // onGameOver
      stopLoop()
      playDeath()
      playDeathAnimation(ctx, state.snake, () => {
        const isRecord = state.score > 0 && state.score >= state.highScore
        showGameOver(overlay, state.score, isRecord)
        startIdleDemo()
      })
    },
    (score, highScore) => {                                   // onScore
      playEat()
      triggerShake(gameWrapper)
      updateScore(hud.score, score)
      updateHighScore(hud.highScore, highScore)

      const isNewRecord = score === highScore && score > 0
      if (isNewRecord) setRecordGlow(hud.highScoreCard, true)

      if (score % 10 === 0) {
        playMilestone()
        showMilestone(milestoneEl, score, isNewRecord)
      } else if (isNewRecord) {
        showMilestone(milestoneEl, score, true)
      }
    },
    () => render(ctx, state),                                 // renderFn
  )
}

// ── Input ──────────────────────────────────────────────────────────────────────
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
  if ((e.key === 'p' || e.key === 'P') && state.running) state.paused = !state.paused
})

// Swipe
let touchStart: { x: number; y: number } | null = null
document.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
}, { passive: true })
document.addEventListener('touchend', (e) => {
  if (!touchStart || !state.running || state.paused || state.autopilot) return
  const dx = e.changedTouches[0].clientX - touchStart.x
  const dy = e.changedTouches[0].clientY - touchStart.y
  touchStart = null
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
  enqueue(
    Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 })
      : (dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 }),
    state.dir,
  )
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
    if (state.running && !state.paused && !state.autopilot) enqueue(dir, state.dir)
  })
})

// ── Leaderboard ────────────────────────────────────────────────────────────────
const lbBtn = document.getElementById('lb-btn') as HTMLButtonElement | null

overlay.saveBtn.addEventListener('click', async () => {
  const name = overlay.playerName.value.trim()
  if (!name) { overlay.playerName.focus(); return }
  overlay.saveBtn.disabled = true
  overlay.saveBtn.textContent = '...'
  try {
    await submitScore(name, state.score)
    const entries = await fetchTop(10)
    renderLeaderboard(overlay, entries)
  } catch {
    overlay.saveBtn.disabled = false
    overlay.saveBtn.textContent = 'SALVA PUNTEGGIO'
  }
})

overlay.playerName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') overlay.saveBtn.click()
})

lbBtn?.addEventListener('click', async () => {
  lbBtn.disabled = true
  lbBtn.textContent = '...'
  try {
    const entries = await fetchTop(10)
    renderLeaderboard(overlay, entries)
    overlay.icon.textContent  = '🏆'
    overlay.title.textContent = 'Classifica'
    overlay.msg.textContent   = ''
    overlay.overlay.style.display = 'flex'
  } finally {
    lbBtn.disabled = false
    lbBtn.textContent = '🏆 Visualizza Top 10'
  }
})

// ── UI toggles ─────────────────────────────────────────────────────────────────
overlay.btn.addEventListener('click', startGame)

hud.autoBtn.addEventListener('click', () => {
  if (!state.running) return
  state.autopilot = !state.autopilot
  setAutopilot(hud.autoBtn, hud.aiBadge, state.autopilot)
})

audioBtn?.addEventListener('click', () => {
  const enabled = !isAudioEnabled()
  setAudioEnabled(enabled)
  audioBtn.classList.toggle('active', enabled)
})

crtBtn?.addEventListener('click', () => {
  gameWrapper.classList.toggle('crt')
  crtBtn.classList.toggle('active', gameWrapper.classList.contains('crt'))
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.running) state.paused = true
})

// ── Boot ───────────────────────────────────────────────────────────────────────
// Init audio button state (enabled by default)
audioBtn?.classList.add('active')

showStart(overlay)
startIdleDemo()
