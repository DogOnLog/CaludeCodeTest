export const COLS   = 10
export const ROWS   = 20
export const CELL   = 25
export const PANEL_X = COLS * CELL + 10  // x where side panel starts (260)

export type PieceType = 'I' | 'O' | 'J' | 'L' | 'S' | 'Z' | 'T'

// 4 rotations per piece, each with 4 [col, row] offsets within a 4×4 bounding box
export const SHAPES: Record<PieceType, [number, number][][]> = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]],
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]],
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]],
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]],
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]],
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]],
  ],
}

export const COLORS: Record<PieceType, string> = {
  I: '#22d3ee', O: '#ffd700', T: '#a855f7',
  S: '#39d98a', Z: '#ff4d4d', J: '#3b82f6', L: '#ff8c42',
}

export function dropInterval(level: number): number {
  return Math.max(50, 1000 - (level - 1) * 90)
}

export type Board = (string | null)[][]

export interface Piece {
  type:     PieceType
  x:        number   // grid col (top-left of 4×4 box)
  y:        number   // grid row (top-left of 4×4 box)
  rotation: number   // 0–3
}

export interface TetrisState {
  board:     Board
  current:   Piece
  next:      Piece
  bag:       PieceType[]
  score:     number
  lines:     number
  level:     number
  highScore: number
  dropTimer: number
  aiTimer:   number
  running:   boolean
  paused:    boolean
  gameOver:  boolean
  autopilot: boolean
  aiTarget:  { rotation: number; x: number } | null
}

const ALL_TYPES: PieceType[] = ['I','O','J','L','S','Z','T']

function shuffled(arr: PieceType[]): PieceType[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function drawFromBag(bag: PieceType[]): { type: PieceType; bag: PieceType[] } {
  if (bag.length === 0) bag = shuffled(ALL_TYPES)
  const type = bag[bag.length - 1]
  return { type, bag: bag.slice(0, -1) }
}

function spawnPiece(type: PieceType): Piece {
  return { type, x: 3, y: -1, rotation: 0 }
}

export function createTetrisState(): TetrisState {
  const highScore = parseInt(localStorage.getItem('tetrisHS') ?? '0')
  let bag: PieceType[] = []
  const { type: t1, bag: b1 } = drawFromBag(bag)
  const { type: t2, bag: b2 } = drawFromBag(b1)
  return {
    board:     Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    current:   spawnPiece(t1),
    next:      spawnPiece(t2),
    bag:       b2,
    score:     0, lines: 0, level: 1, highScore,
    dropTimer: 0, aiTimer: 0,
    running:   false, paused: false, gameOver: false,
    autopilot: false, aiTarget: null,
  }
}
