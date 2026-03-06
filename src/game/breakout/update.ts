import {
  BreakoutState, Brick,
  W, H, PADDLE_H, PADDLE_Y, BALL_R,
  BRICK_W, BRICK_H, ROW_POINTS, PADDLE_SPEED, resetBall,
} from './state'

export function updateBreakout(
  state:       BreakoutState,
  held:        Set<string>,
  onGameOver:  () => void,
  onScore:     (score: number, hs: number) => void,
  onWin:       () => void,
): void {
  if (!state.running || state.paused || state.won) return

  // ── Paddle movement ──────────────────────────────────────────────────────
  const paddleMaxX = W - state.paddleW
  if (state.autopilot) {
    const target = state.ball.x - state.paddleW / 2
    const dx = target - state.paddleX
    state.paddleX += Math.sign(dx) * Math.min(Math.abs(dx), PADDLE_SPEED)
  } else {
    if (held.has('ArrowLeft')  || held.has('KeyA')) state.paddleX -= PADDLE_SPEED
    if (held.has('ArrowRight') || held.has('KeyD')) state.paddleX += PADDLE_SPEED
  }
  state.paddleX = Math.max(0, Math.min(state.paddleX, paddleMaxX))

  // ── Ball movement ────────────────────────────────────────────────────────
  state.ball.x += state.ball.vx
  state.ball.y += state.ball.vy

  // Wall X
  if (state.ball.x - BALL_R <= 0)  { state.ball.x = BALL_R;      state.ball.vx =  Math.abs(state.ball.vx) }
  if (state.ball.x + BALL_R >= W)  { state.ball.x = W - BALL_R;  state.ball.vx = -Math.abs(state.ball.vx) }
  // Ceiling
  if (state.ball.y - BALL_R <= 0)  { state.ball.y = BALL_R;      state.ball.vy =  Math.abs(state.ball.vy) }

  // ── Paddle collision ─────────────────────────────────────────────────────
  if (
    state.ball.vy > 0 &&
    state.ball.y + BALL_R >= PADDLE_Y &&
    state.ball.y + BALL_R <= PADDLE_Y + PADDLE_H + 8 &&
    state.ball.x >= state.paddleX - 2 &&
    state.ball.x <= state.paddleX + state.paddleW + 2
  ) {
    state.ball.y = PADDLE_Y - BALL_R
    const hit   = (state.ball.x - state.paddleX) / state.paddleW
    const angle = (hit - 0.5) * 2 * (Math.PI * 0.38)
    const speed = Math.hypot(state.ball.vx, state.ball.vy)
    state.ball.vx = speed * Math.sin(angle)
    state.ball.vy = -speed * Math.abs(Math.cos(angle))
  }

  // ── Brick collision ──────────────────────────────────────────────────────
  let hit: Brick | null = null
  let hitDist = Infinity
  for (const brick of state.bricks) {
    if (!brick.alive) continue
    if (
      state.ball.x + BALL_R > brick.x &&
      state.ball.x - BALL_R < brick.x + BRICK_W &&
      state.ball.y + BALL_R > brick.y &&
      state.ball.y - BALL_R < brick.y + BRICK_H
    ) {
      const d = Math.hypot(state.ball.x - (brick.x + BRICK_W / 2), state.ball.y - (brick.y + BRICK_H / 2))
      if (d < hitDist) { hitDist = d; hit = brick }
    }
  }

  if (hit) {
    hit.alive = false
    const ol = (state.ball.x + BALL_R) - hit.x
    const or_ = (hit.x + BRICK_W) - (state.ball.x - BALL_R)
    const ot = (state.ball.y + BALL_R) - hit.y
    const ob = (hit.y + BRICK_H) - (state.ball.y - BALL_R)
    if (Math.min(ot, ob) <= Math.min(ol, or_)) state.ball.vy = -state.ball.vy
    else                                        state.ball.vx = -state.ball.vx

    const pts = ROW_POINTS[hit.row] ?? 1
    state.score += pts
    if (state.score > state.highScore) {
      state.highScore = state.score
      localStorage.setItem('breakoutHS', String(state.highScore))
    }
    onScore(state.score, state.highScore)

    // Speed up every 10 bricks destroyed
    const destroyed = state.bricks.filter(b => !b.alive).length
    if (destroyed % 10 === 0) {
      const spd = Math.hypot(state.ball.vx, state.ball.vy)
      if (spd < 8) { state.ball.vx *= 1.08; state.ball.vy *= 1.08 }
    }

    if (state.bricks.every(b => !b.alive)) { onWin(); return }
  }

  // ── Ball lost ────────────────────────────────────────────────────────────
  if (state.ball.y - BALL_R > H) {
    state.lives--
    if (state.lives <= 0) { state.running = false; onGameOver() }
    else resetBall(state)
  }
}
