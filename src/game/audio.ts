let audioCtx: AudioContext | null = null
let _enabled = true

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(
  freq: number,
  type: OscillatorType,
  volume: number,
  startAt: number,
  duration: number,
): void {
  const c = ctx()
  const osc  = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
  osc.start(startAt)
  osc.stop(startAt + duration)
}

export function playEat(): void {
  if (!_enabled) return
  tone(880, 'square', 0.12, ctx().currentTime, 0.06)
}

export function playMilestone(): void {
  if (!_enabled) return
  const t = ctx().currentTime
  tone(660, 'square', 0.10, t,        0.05)
  tone(880, 'square', 0.10, t + 0.06, 0.05)
}

export function playDeath(): void {
  if (!_enabled) return
  const t = ctx().currentTime
  const notes = [330, 262, 196, 147]
  notes.forEach((freq, i) => tone(freq, 'sawtooth', 0.15, t + i * 0.09, 0.08))
}

export function setAudioEnabled(val: boolean): void { _enabled = val }
export function isAudioEnabled(): boolean { return _enabled }
