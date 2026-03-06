import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/portfolio.css'
import './styles/leaderboard.css'

import { fetchTop } from './lib/leaderboard'

async function renderTable(listId: string, table: 'leaderboard' | 'leaderboard_breakout'): Promise<void> {
  const el = document.getElementById(listId)!
  el.innerHTML = '<li class="lb-page-loading">Caricamento...</li>'
  try {
    const entries = await fetchTop(10, table)
    if (entries.length === 0) {
      el.innerHTML = '<li class="lb-page-empty">Nessun punteggio ancora</li>'
      return
    }
    el.innerHTML = entries.map((e, i) => `
      <li class="lb-page-row ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">
        <span class="lb-page-rank">${i + 1}</span>
        <span class="lb-page-player">${escapeHtml(e.player)}</span>
        <span class="lb-page-score">${e.score}</span>
      </li>`).join('')
  } catch {
    el.innerHTML = '<li class="lb-page-empty">Errore nel caricamento</li>'
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

renderTable('snake-list',   'leaderboard')
renderTable('breakout-list','leaderboard_breakout')
renderTable('tetris-list',  'leaderboard_tetris')
