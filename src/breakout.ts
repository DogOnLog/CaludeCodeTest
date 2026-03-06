import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/game.css'

import { createBreakoutState, BreakoutState, W, H } from './game/breakout/state'
import { updateBreakout } from './game/breakout/update'
import { renderBreakout } from './game/breakout/renderer'
import { triggerShake, showMilestone } from './game/effects'
import { playEat, playDeath, playMilestone, setAudioEnabled, isAudioEnabled } from './game/audio'
import { getOverlayEls, showStart, showGameOver, hideOverlay, renderLeaderboard } from './ui/overlay'
import { getHudEls, updateScore, updateHighScore, setAutopilot, setRecordGlow } from './ui/hud'
import { submitScore, fetchTop } from './lib/leaderboard'

// ── DOM ───────────────────────────────────────────────────────────────────────
const canvas         = document.getElementById('canvas') as HTMLCanvasElement
const ctx            = canvas.getContext('2d')!
const gameWrapper    = document.getElementById('game-wrapper') as HTMLElement
const milestoneEl    = document.getElementById('milestone') as HTMLElement
const livesEl        = document.getElementById('lives-val') as HTMLElement | null
const audioBtn       = document.getElementById('audio-btn')       as HTMLButtonElement | null
const crtBtn         = document.getElementById('crt-btn')         as HTMLButtonElement | null
const lbBtn          = document.getElementById('lb-btn')          as HTMLButtonElement | null
const shortcutsPanel = document.getElementById('shortcuts-panel') as HTMLElement | null
const shortcutsBtn   = document.getElementById('shortcuts-btn')   as HTMLButtonElement | null
const shortcutsClose = document.getElementById('shortcuts-close') as HTMLButtonElement | null
const overlay        = getOverlayEls()
const hud            = getHudEls()

// ── Held keys ────────────────────────────────────────────────────────────────
const held = new Set<string>()
document.addEventListener('keydown', e => held.add(e.code))
document.addEventListener('keyup',   e => held.delete(e.code))

// ── rAF loop ─────────────────────────────────────────────────────────────────
let rafId: number | null = null
let lastTime = 0

function startLoop(
  state:      BreakoutState,
  onGameOver: () => void,
  onScore:    (s: number, hs: number) => void,
  onWin:      () => void,
): void {
  stopLoop()
  lastTime = 0
  rafId = requestAnimationFrame(function tick(now) {
    if (!lastTime) lastTime = now
    const dt    = now - lastTime
    lastTime    = now
    const steps = Math.min(Math.floor(dt / 16), 4)
    for (let i = 0; i < steps; i++)
      updateBreakout(state, held, onGameOver, onScore, onWin)
    renderBreakout(ctx, state)
    rafId = requestAnimationFrame(tick)
  })
}

function stopLoop(): void {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
}

// ── Death flash ───────────────────────────────────────────────────────────────
function flashDeath(onDone: () => void): void {
  let start: number | null = null
  function frame(now: number) {
    if (!start) start = now
    const t = (now - start) / 500
    renderBreakout(ctx, state)
    ctx.fillStyle = `rgba(255, 77, 77, ${0.55 * Math.pow(1 - Math.min(t, 1), 2)})`
    ctx.fillRect(0, 0, W, H)
    if (t < 1) requestAnimationFrame(frame)
    else onDone()
  }
  requestAnimationFrame(frame)
}

// ── Idle demo ─────────────────────────────────────────────────────────────────
function startIdleDemo(): void {
  const demo = createBreakoutState()
  demo.running = true; demo.autopilot = true
  const reset = () => { Object.assign(demo, createBreakoutState()); demo.running = true; demo.autopilot = true }
  startLoop(demo, reset, () => {}, reset)
}

// ── Lives display ─────────────────────────────────────────────────────────────
function updateLives(lives: number): void {
  if (!livesEl) return
  livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives))
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = createBreakoutState()
updateHighScore(hud.highScore, state.highScore)

// ── Game lifecycle ─────────────────────────────────────────────────────────────
function startGame(): void {
  state = createBreakoutState()
  state.running = true
  updateScore(hud.score, 0)
  updateHighScore(hud.highScore, state.highScore)
  updateLives(state.lives)
  setRecordGlow(hud.highScoreCard, false)
  setAutopilot(hud.autoBtn, hud.aiBadge, false)
  hideOverlay(overlay)

  startLoop(
    state,
    () => {                                           // onGameOver
      stopLoop()
      playDeath()
      flashDeath(() => {
        const isRecord = state.score > 0 && state.score >= state.highScore
        showGameOver(overlay, state.score, isRecord)
        startIdleDemo()
      })
    },
    (score, highScore) => {                           // onScore
      playEat()
      updateScore(hud.score, score)
      updateHighScore(hud.highScore, highScore)
      const isNewRecord = score === highScore && score > 0
      if (isNewRecord) setRecordGlow(hud.highScoreCard, true)
      if (score % 20 === 0) {
        playMilestone()
        triggerShake(gameWrapper)
        showMilestone(milestoneEl, score, isNewRecord)
      } else if (isNewRecord) {
        showMilestone(milestoneEl, score, true)
      }
    },
    () => {                                           // onWin
      stopLoop()
      playMilestone()
      overlay.icon.textContent  = '🎉'
      overlay.title.textContent = 'Vittoria!'
      overlay.msg.textContent   = `Tutti i mattoni distrutti!\nPunteggio: ${state.score}`
      overlay.btn.textContent   = 'RIGIOCA'
      overlay.lbSection.classList.add('hidden')
      if (state.score > 0) {
        overlay.playerName.value    = ''
        overlay.saveBtn.disabled    = false
        overlay.saveBtn.textContent = 'SALVA PUNTEGGIO'
        overlay.nameSection.classList.remove('hidden')
      }
      overlay.overlay.style.display = 'flex'
      startIdleDemo()
    },
  )
}

// ── Lives sync during game ────────────────────────────────────────────────────
setInterval(() => { if (state.running) updateLives(state.lives) }, 100)

// ── Input: keyboard ───────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.key === 'p' || e.key === 'P') && state.running) state.paused = !state.paused
  if (e.key === '?')   shortcutsPanel?.classList.remove('hidden')
  if (e.key === 'Escape') shortcutsPanel?.classList.add('hidden')
  if (e.key.startsWith('Arrow')) e.preventDefault()
})

// Touch: drag paddle
let touchX: number | null = null
document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX }, { passive: true })
document.addEventListener('touchmove', e => {
  if (touchX === null || !state.running || state.paused || state.autopilot) return
  const dx = e.touches[0].clientX - touchX
  touchX = e.touches[0].clientX
  const scale = W / canvas.getBoundingClientRect().width
  state.paddleX = Math.max(0, Math.min(W - state.paddleW, state.paddleX + dx * scale))
}, { passive: true })

// D-pad
document.getElementById('d-left')?.addEventListener('pointerdown',  () => held.add('ArrowLeft'))
document.getElementById('d-right')?.addEventListener('pointerdown', () => held.add('ArrowRight'))
document.addEventListener('pointerup', () => { held.delete('ArrowLeft'); held.delete('ArrowRight') })

// ── Leaderboard ───────────────────────────────────────────────────────────────
overlay.saveBtn.addEventListener('click', async () => {
  const name = overlay.playerName.value.trim()
  if (!name) { overlay.playerName.focus(); return }
  overlay.saveBtn.disabled    = true
  overlay.saveBtn.textContent = '...'
  try {
    await submitScore(name, state.score, 'leaderboard_breakout')
    const entries = await fetchTop(10, 'leaderboard_breakout')
    renderLeaderboard(overlay, entries)
  } catch {
    overlay.saveBtn.disabled    = false
    overlay.saveBtn.textContent = 'SALVA PUNTEGGIO'
  }
})
overlay.playerName.addEventListener('keydown', e => { if (e.key === 'Enter') overlay.saveBtn.click() })

lbBtn?.addEventListener('click', async () => {
  lbBtn.disabled      = true
  lbBtn.textContent   = '...'
  try {
    const entries = await fetchTop(10, 'leaderboard_breakout')
    renderLeaderboard(overlay, entries)
    overlay.icon.textContent          = '🏆'
    overlay.title.textContent         = 'Classifica'
    overlay.msg.textContent           = ''
    overlay.overlay.style.display     = 'flex'
  } finally {
    lbBtn.disabled    = false
    lbBtn.textContent = '🏆 Visualizza Top 10'
  }
})

// ── UI toggles ────────────────────────────────────────────────────────────────
overlay.btn.addEventListener('click', startGame)

hud.autoBtn.addEventListener('click', () => {
  if (!state.running) return
  state.autopilot = !state.autopilot
  setAutopilot(hud.autoBtn, hud.aiBadge, state.autopilot)
  hud.autoBtn.setAttribute('aria-pressed', String(state.autopilot))
})

audioBtn?.addEventListener('click', () => {
  const enabled = !isAudioEnabled()
  setAudioEnabled(enabled)
  audioBtn.classList.toggle('active', enabled)
  audioBtn.setAttribute('aria-pressed', String(enabled))
})

crtBtn?.addEventListener('click', () => {
  gameWrapper.classList.toggle('crt')
  const on = gameWrapper.classList.contains('crt')
  crtBtn.classList.toggle('active', on)
  crtBtn?.setAttribute('aria-pressed', String(on))
})

function openShortcuts(): void  { shortcutsPanel?.classList.remove('hidden') }
function closeShortcuts(): void { shortcutsPanel?.classList.add('hidden') }
shortcutsBtn?.addEventListener('click', openShortcuts)
shortcutsClose?.addEventListener('click', closeShortcuts)
shortcutsPanel?.addEventListener('click', e => { if (e.target === shortcutsPanel) closeShortcuts() })

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.running) state.paused = true
})

// ── Boot ──────────────────────────────────────────────────────────────────────
audioBtn?.classList.add('active')
showStart(overlay)
startIdleDemo()
