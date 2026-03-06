import { Vec2 } from './state'

const MAX_QUEUE = 2
const queue: Vec2[] = []

export function enqueue(dir: Vec2, currentDir: Vec2): void {
  const last: Vec2 = queue[queue.length - 1] ?? currentDir
  // Reject if opposite to last queued or identical
  if (dir.x === -last.x && dir.y === -last.y) return
  if (dir.x === last.x && dir.y === last.y) return
  if (queue.length < MAX_QUEUE) queue.push({ ...dir })
}

export function dequeue(): Vec2 | null {
  return queue.shift() ?? null
}

export function clearQueue(): void {
  queue.length = 0
}
