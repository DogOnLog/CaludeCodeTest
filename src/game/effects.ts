import { Vec2, GRID } from './state'

// ── Screen shake ─────────────────────────────────────────────────────────────
export function triggerShake(el: HTMLElement): void {
  el.classList.remove('shake')
  void el.offsetWidth // force reflow
  el.classList.add('shake')
}

// ── Death animation ───────────────────────────────────────────────────────────
export function playDeathAnimation(
  ctx: CanvasRenderingContext2D,
  snake: Vec2[],
  onComplete: () => void,
): void {
  const start    = performance.now()
  const DURATION = 550

  function frame(now: number): void {
    const t = Math.min((now - start) / DURATION, 1)

    // Flash snake segments red (alternating at 10fps pace)
    const flash = Math.floor(now / 70) % 2 === 0
    if (flash) {
      snake.forEach(seg => {
        ctx.fillStyle = `rgba(255, 60, 60, ${0.5 + t * 0.4})`
        ctx.beginPath()
        ctx.roundRect(seg.x * GRID + 2, seg.y * GRID + 2, GRID - 4, GRID - 4, 3)
        ctx.fill()
      })
    }

    // Red vignette that grows with time
    ctx.fillStyle = `rgba(200, 30, 30, ${t * 0.22})`
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    if (t < 1) requestAnimationFrame(frame)
    else onComplete()
  }

  requestAnimationFrame(frame)
}

// ── Milestone float text ──────────────────────────────────────────────────────
export function showMilestone(el: HTMLElement, score: number, isRecord: boolean): void {
  el.textContent   = isRecord ? '🏆 RECORD!' : `+${score} punti!`
  el.className     = 'milestone' + (isRecord ? ' record' : '')
  void el.offsetWidth
  el.classList.add('animate')
  setTimeout(() => { el.className = 'milestone' }, 1300)
}
