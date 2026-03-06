export interface HudEls {
  score:          HTMLElement
  highScore:      HTMLElement
  highScoreCard:  HTMLElement
  autoBtn:        HTMLButtonElement
  aiBadge:        HTMLElement
}

export function getHudEls(): HudEls {
  return {
    score:         document.getElementById('score')!,
    highScore:     document.getElementById('high-score')!,
    highScoreCard: document.getElementById('high-score-card')!,
    autoBtn:       document.getElementById('auto-btn') as HTMLButtonElement,
    aiBadge:       document.getElementById('ai-badge')!,
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

export function setAutopilot(btn: HTMLButtonElement, badge: HTMLElement, active: boolean): void {
  btn.classList.toggle('active', active)
  badge.classList.toggle('visible', active)
}

export function setRecordGlow(card: HTMLElement, active: boolean): void {
  card.classList.toggle('stat-card--record', active)
}

function pop(el: HTMLElement): void {
  el.classList.remove('pop')
  void el.offsetWidth
  el.classList.add('pop')
  setTimeout(() => el.classList.remove('pop'), 150)
}
