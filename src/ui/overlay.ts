export interface OverlayEls {
  overlay: HTMLElement
  icon: HTMLElement
  title: HTMLElement
  msg: HTMLElement
  btn: HTMLButtonElement
}

export function getOverlayEls(): OverlayEls {
  return {
    overlay: document.getElementById('overlay')!,
    icon:    document.getElementById('overlay-icon')!,
    title:   document.getElementById('overlay-title')!,
    msg:     document.getElementById('overlay-msg')!,
    btn:     document.getElementById('btn') as HTMLButtonElement,
  }
}

export function showStart(els: OverlayEls): void {
  els.icon.textContent  = '🐍'
  els.title.textContent = 'Snake'
  els.msg.textContent   = 'Guida il serpente verso il cibo.\nEvita i muri e te stesso.'
  els.btn.textContent   = 'INIZIA'
  els.overlay.style.display = 'flex'
}

export function showGameOver(els: OverlayEls, score: number, isRecord: boolean): void {
  els.icon.textContent  = isRecord && score > 0 ? '🏆' : '💀'
  els.title.textContent = 'Game Over'
  els.msg.textContent   = isRecord && score > 0
    ? `Nuovo record: ${score} punt${score === 1 ? 'o' : 'i'}!`
    : `Punteggio: ${score} punt${score === 1 ? 'o' : 'i'}`
  els.btn.textContent   = 'RIPROVA'
  els.overlay.style.display = 'flex'
}

export function hideOverlay(els: OverlayEls): void {
  els.overlay.style.display = 'none'
}
