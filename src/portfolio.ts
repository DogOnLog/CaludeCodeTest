import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/portfolio.css'

// Load personal best scores from localStorage
const hsSnake = localStorage.getItem('snakeHS')
const el = document.getElementById('hs-snake')
if (el) el.textContent = hsSnake && hsSnake !== '0' ? hsSnake : '—'
