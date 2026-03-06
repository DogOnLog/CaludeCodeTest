export interface OverlayEls {
  overlay:     HTMLElement
  icon:        HTMLElement
  title:       HTMLElement
  msg:         HTMLElement
  btn:         HTMLButtonElement
  nameSection: HTMLElement
  playerName:  HTMLInputElement
  saveBtn:     HTMLButtonElement
  lbSection:   HTMLElement
  lbList:      HTMLElement
}

export function getOverlayEls(): OverlayEls {
  return {
    overlay:     document.getElementById('overlay')!,
    icon:        document.getElementById('overlay-icon')!,
    title:       document.getElementById('overlay-title')!,
    msg:         document.getElementById('overlay-msg')!,
    btn:         document.getElementById('btn') as HTMLButtonElement,
    nameSection: document.getElementById('name-section')!,
    playerName:  document.getElementById('player-name') as HTMLInputElement,
    saveBtn:     document.getElementById('save-btn') as HTMLButtonElement,
    lbSection:   document.getElementById('lb-section')!,
    lbList:      document.getElementById('lb-list')!,
  }
}

export function showStart(els: OverlayEls): void {
  els.nameSection.classList.add('hidden')
  els.lbSection.classList.add('hidden')
  els.overlay.style.display = 'flex'
}

export function showGameOver(els: OverlayEls, score: number, isRecord: boolean): void {
  els.icon.textContent  = isRecord && score > 0 ? '🏆' : '💀'
  els.title.textContent = 'Game Over'
  els.msg.textContent   = isRecord && score > 0
    ? `Nuovo record: ${score} punt${score === 1 ? 'o' : 'i'}!`
    : `Punteggio: ${score} punt${score === 1 ? 'o' : 'i'}`
  els.btn.textContent = 'RIPROVA'
  els.lbSection.classList.add('hidden')
  if (score > 0) {
    els.playerName.value = ''
    els.saveBtn.disabled = false
    els.saveBtn.textContent = 'SALVA PUNTEGGIO'
    els.nameSection.classList.remove('hidden')
  } else {
    els.nameSection.classList.add('hidden')
  }
  els.overlay.style.display = 'flex'
}

export function hideOverlay(els: OverlayEls): void {
  els.overlay.style.display = 'none'
}

export function renderLeaderboard(els: OverlayEls, entries: { player: string; score: number }[]): void {
  els.lbList.innerHTML = entries.length === 0
    ? '<li class="lb-empty">Nessun punteggio ancora</li>'
    : entries.map((e, i) => `
        <li class="lb-row">
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-player">${escapeHtml(e.player)}</span>
          <span class="lb-score">${e.score}</span>
        </li>`).join('')
  els.nameSection.classList.add('hidden')
  els.lbSection.classList.remove('hidden')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
