import {
  TetrisState, Board, Piece, PieceType,
  SHAPES, COLORS, COLS, ROWS, drawFromBag, dropInterval,
} from './state'

// ── Collision ─────────────────────────────────────────────────────────────────
export function canPlace(board: Board, piece: Piece, dx = 0, dy = 0, drot = 0): boolean {
  const rot = (piece.rotation + drot + 4) % 4
  return SHAPES[piece.type][rot].every(([cx, cy]) => {
    const nx = piece.x + cx + dx
    const ny = piece.y + cy + dy
    return nx >= 0 && nx < COLS && ny < ROWS && (ny < 0 || board[ny][nx] === null)
  })
}

// ── Ghost piece ───────────────────────────────────────────────────────────────
export function ghostY(board: Board, piece: Piece): number {
  let dy = 0
  while (canPlace(board, piece, 0, dy + 1)) dy++
  return piece.y + dy
}

// ── Moves ─────────────────────────────────────────────────────────────────────
export function moveLeft(state: TetrisState): boolean {
  if (canPlace(state.board, state.current, -1)) { state.current.x--; return true }
  return false
}

export function moveRight(state: TetrisState): boolean {
  if (canPlace(state.board, state.current, 1)) { state.current.x++; return true }
  return false
}

export function moveDown(state: TetrisState): boolean {
  if (canPlace(state.board, state.current, 0, 1)) { state.current.y++; return true }
  return false
}

export function rotate(state: TetrisState, dir: 1 | -1): void {
  if (canPlace(state.board, state.current, 0, 0, dir)) {
    state.current.rotation = (state.current.rotation + dir + 4) % 4
    return
  }
  for (const dx of [-1, 1, -2, 2]) {
    if (canPlace(state.board, state.current, dx, 0, dir)) {
      state.current.x += dx
      state.current.rotation = (state.current.rotation + dir + 4) % 4
      return
    }
  }
  for (const dy of [-1, -2]) {
    if (canPlace(state.board, state.current, 0, dy, dir)) {
      state.current.y += dy
      state.current.rotation = (state.current.rotation + dir + 4) % 4
      return
    }
  }
}

export function hardDrop(state: TetrisState): void {
  let dy = 0
  while (canPlace(state.board, state.current, 0, dy + 1)) dy++
  state.current.y += dy
  state.score += dy * 2
}

// ── Lock & spawn ──────────────────────────────────────────────────────────────
function clearLines(board: Board): number {
  let cleared = 0
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(c => c !== null)) {
      board.splice(r, 1)
      board.unshift(Array(COLS).fill(null))
      cleared++; r++
    }
  }
  return cleared
}

const LINE_POINTS = [0, 100, 300, 500, 800]

export function lockAndSpawn(state: TetrisState): { linesCleared: number; points: number } {
  // Place current piece on board
  for (const [cx, cy] of SHAPES[state.current.type][state.current.rotation]) {
    const nx = state.current.x + cx
    const ny = state.current.y + cy
    if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS)
      state.board[ny][nx] = COLORS[state.current.type]
  }

  const linesCleared = clearLines(state.board)
  const points       = (LINE_POINTS[linesCleared] ?? 0) * state.level
  state.score += points
  state.lines += linesCleared
  state.level  = Math.floor(state.lines / 10) + 1

  if (state.score > state.highScore) {
    state.highScore = state.score
    localStorage.setItem('tetrisHS', String(state.highScore))
  }

  // Spawn next piece
  state.current  = state.next
  state.dropTimer = 0
  state.aiTarget  = null

  const { type, bag } = drawFromBag(state.bag)
  state.next = { type, x: 3, y: -1, rotation: 0 }
  state.bag  = bag

  // Game over if new piece can't be placed
  if (!canPlace(state.board, state.current)) {
    state.gameOver = true
    state.running  = false
  }

  return { linesCleared, points }
}

// ── Main update (called each frame with real dt) ───────────────────────────────
export function updateTetris(
  state:      TetrisState,
  dt:         number,
  onGameOver: () => void,
  onScore:    (score: number, hs: number, lines: number) => void,
): void {
  if (!state.running || state.paused) return

  // Auto-drop
  state.dropTimer += dt
  const interval = dropInterval(state.level)
  if (state.dropTimer >= interval) {
    state.dropTimer -= interval
    if (!moveDown(state)) {
      const { linesCleared, points } = lockAndSpawn(state)
      if (points > 0 || linesCleared > 0) onScore(state.score, state.highScore, linesCleared)
      if (state.gameOver) { onGameOver(); return }
    }
  }

  // AI
  if (state.autopilot) {
    state.aiTimer += dt
    if (state.aiTimer >= 80) {
      state.aiTimer = 0
      doAIMove(state)
    }
  }
}

// ── Autopilot ─────────────────────────────────────────────────────────────────
function colHeights(board: Board): number[] {
  return Array.from({ length: COLS }, (_, c) => {
    for (let r = 0; r < ROWS; r++) if (board[r][c]) return ROWS - r
    return 0
  })
}

function evalBoard(board: Board, linesCleared: number): number {
  const heights = colHeights(board)
  const aggH    = heights.reduce((a, b) => a + b, 0)
  const maxH    = Math.max(...heights)
  let holes = 0, bump = 0
  for (let c = 0; c < COLS; c++) {
    let found = false
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c]) found = true
      else if (found) holes++
    }
    if (c < COLS - 1) bump += Math.abs(heights[c] - heights[c + 1])
  }
  return linesCleared * 200 - aggH * 0.51 - holes * 0.71 - bump * 0.18 - maxH * 0.4
}

function findBest(state: TetrisState): { rotation: number; x: number } {
  let best = { rotation: 0, x: 3 }
  let bestScore = -Infinity

  for (let rot = 0; rot < 4; rot++) {
    const cells  = SHAPES[state.current.type][rot]
    const minCol = Math.min(...cells.map(([c]) => c))
    const maxCol = Math.max(...cells.map(([c]) => c))

    for (let x = -minCol; x <= COLS - 1 - maxCol; x++) {
      const test: Piece = { ...state.current, rotation: rot, x, y: 0 }
      if (!canPlace(state.board, test)) continue

      // Land the piece
      let y = 0
      while (canPlace(state.board, { ...test, y: y + 1 })) y++
      const landed = { ...test, y }

      // Place on temp board
      const tmp = state.board.map(r => [...r])
      for (const [cx, cy] of SHAPES[state.current.type][rot]) {
        const ny = y + cy, nx = x + cx
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS)
          tmp[ny][nx] = COLORS[state.current.type]
      }
      const cleared = tmp.filter(r => r.every(c => c !== null)).length
      const evalB   = tmp.filter(r => !r.every(c => c !== null))
      while (evalB.length < ROWS) evalB.unshift(Array(COLS).fill(null))

      const sc = evalBoard(evalB, cleared)
      if (sc > bestScore) { bestScore = sc; best = { rotation: rot, x } }

      void landed  // suppress unused warning
    }
  }
  return best
}

function doAIMove(state: TetrisState): void {
  if (!state.aiTarget) state.aiTarget = findBest(state)
  const { rotation, x } = state.aiTarget

  if (state.current.rotation !== rotation) {
    rotate(state, 1)
  } else if (state.current.x < x) {
    moveRight(state)
  } else if (state.current.x > x) {
    moveLeft(state)
  } else {
    // In position — hard drop
    hardDrop(state)
    const { linesCleared, points } = lockAndSpawn(state)
    void linesCleared; void points
    state.aiTarget = null
  }
}
