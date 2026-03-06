export interface HudEls {
  score:     HTMLElement
  highScore: HTMLElement
  autoBtn:   HTMLButtonElement
}

export function getHudEls(): HudEls {
  return {
    score:     document.getElementById('score')!,
    highScore: document.getElementById('high-score')!,
    autoBtn:   document.getElementById('auto-btn') as HTMLButtonElement,
  }
}

export function updateScore(el: HTMLElement, value: number): void {
  el.textContent = String(value)
  pop(el)
}

export function updateHighScore(el: HTMLElement, value: number): void {
  el.textContent = String(value)
  pop(el)
}

export function setAutopilot(btn: HTMLButtonElement, active: boolean): void {
  btn.classList.toggle('active', active)
}

function pop(el: HTMLElement): void {
  el.classList.remove('pop')
  void el.offsetWidth // force reflow
  el.classList.add('pop')
  setTimeout(() => el.classList.remove('pop'), 150)
}
