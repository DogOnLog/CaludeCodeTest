import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/portfolio.css'

// Load personal best scores from localStorage
const hsSnake    = localStorage.getItem('snakeHS')
const hsBreakout = localStorage.getItem('breakoutHS')

const hsTetris   = localStorage.getItem('tetrisHS')

const elSnake    = document.getElementById('hs-snake')
const elBreakout = document.getElementById('hs-breakout')
const elTetris   = document.getElementById('hs-tetris')
if (elSnake)    elSnake.textContent    = hsSnake    && hsSnake    !== '0' ? hsSnake    : '—'
if (elBreakout) elBreakout.textContent = hsBreakout && hsBreakout !== '0' ? hsBreakout : '—'
if (elTetris)   elTetris.textContent   = hsTetris   && hsTetris   !== '0' ? hsTetris   : '—'
