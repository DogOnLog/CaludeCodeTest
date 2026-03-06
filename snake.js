const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const btn = document.getElementById('btn');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');

const GRID = 20;
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;
const SPEED = 120;

let snake, dir, nextDir, food, score, highScore, gameLoop, running, paused, autopilot;

const autoBtn = document.getElementById('auto-btn');

highScore = parseInt(localStorage.getItem('snakeHS') || '0');
highScoreEl.textContent = highScore;

function init() {
  snake = [
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = 0;
  paused = false;
  placeFood();
}

// BFS pathfinding per l'autopilota
function bfs(start, target, snakeBody) {
  const blocked = new Set(snakeBody.map(s => `${s.x},${s.y}`));
  const queue = [{ pos: start, path: [] }];
  const visited = new Set([`${start.x},${start.y}`]);
  const moves = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];

  while (queue.length) {
    const { pos, path } = queue.shift();
    for (const m of moves) {
      const nx = pos.x + m.x, ny = pos.y + m.y;
      const key = `${nx},${ny}`;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (blocked.has(key) || visited.has(key)) continue;
      const newPath = [...path, m];
      if (nx === target.x && ny === target.y) return newPath;
      visited.add(key);
      queue.push({ pos: {x: nx, y: ny}, path: newPath });
    }
  }
  return null;
}

function autopilotMove() {
  const head = snake[0];
  let path = bfs(head, food, snake);

  if (!path) {
    // Nessun percorso verso il cibo: sopravvivi muovendoti in una direzione libera
    const moves = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
    const blocked = new Set(snake.map(s => `${s.x},${s.y}`));
    for (const m of moves) {
      const nx = head.x + m.x, ny = head.y + m.y;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !blocked.has(`${nx},${ny}`)) {
        path = [m];
        break;
      }
    }
  }

  if (path && path.length > 0) {
    const m = path[0];
    // Non invertire la direzione
    if (!(m.x === -dir.x && m.y === -dir.y)) {
      nextDir = m;
    }
  }
}

function placeFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function update() {
  if (paused) return;
  if (autopilot) autopilotMove();
  dir = { ...nextDir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver();
  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    popScore(scoreEl);
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      popScore(highScoreEl);
      localStorage.setItem('snakeHS', highScore);
    }
    placeFood();
  } else {
    snake.pop();
  }
}

function draw() {
  // Background
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid dots
  ctx.fillStyle = '#1e1e30';
  for (let x = 0; x < COLS; x++)
    for (let y = 0; y < ROWS; y++)
      ctx.fillRect(x * GRID + GRID/2 - 1, y * GRID + GRID/2 - 1, 2, 2);

  // Food
  const fx = food.x * GRID, fy = food.y * GRID;
  ctx.fillStyle = '#ff6b6b';
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(fx + GRID/2, fy + GRID/2, GRID/2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snake
  snake.forEach((seg, i) => {
    const ratio = 1 - i / snake.length;
    ctx.fillStyle = i === 0 ? '#4ecca3' : `hsl(161, 60%, ${25 + ratio * 25}%)`;
    ctx.shadowColor = i === 0 ? '#4ecca3' : 'transparent';
    ctx.shadowBlur = i === 0 ? 10 : 0;
    const pad = i === 0 ? 1 : 2;
    ctx.beginPath();
    ctx.roundRect(seg.x * GRID + pad, seg.y * GRID + pad, GRID - pad*2, GRID - pad*2, i === 0 ? 5 : 3);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // Paused
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4ecca3';
    ctx.font = 'bold 2rem Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSA', canvas.width/2, canvas.height/2);
  }
}

function gameOver() {
  clearInterval(gameLoop);
  running = false;
  document.getElementById('overlay-icon').textContent = '💀';
  overlayTitle.textContent = 'Game Over';
  overlayMsg.textContent = `Hai totalizzato ${score} punt${score===1?'o':'i'}.\n${score >= highScore && score > 0 ? '🏆 Nuovo record!' : 'Riprova a battere il record!'}`;
  btn.textContent = 'RIPROVA';
  overlay.style.display = 'flex';
}

function startGame() {
  overlay.style.display = 'none';
  document.getElementById('overlay-icon').textContent = '🐍';
  init();
  if (gameLoop) clearInterval(gameLoop);
  running = true;
  autopilot = false;
  autoBtn.classList.remove('active');
  gameLoop = setInterval(() => { update(); draw(); }, SPEED);
}

btn.addEventListener('click', startGame);

autoBtn.addEventListener('click', () => {
  if (!running) return;
  autopilot = !autopilot;
  autoBtn.classList.toggle('active', autopilot);
});

// Touch d-pad
document.getElementById('d-up')   ?.addEventListener('click', () => { if(dir.y!==1)  nextDir={x:0,y:-1}; });
document.getElementById('d-down') ?.addEventListener('click', () => { if(dir.y!==-1) nextDir={x:0,y:1};  });
document.getElementById('d-left') ?.addEventListener('click', () => { if(dir.x!==1)  nextDir={x:-1,y:0}; });
document.getElementById('d-right')?.addEventListener('click', () => { if(dir.x!==-1) nextDir={x:1,y:0};  });

// Score pop animation
function popScore(el) {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 150);
}

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': if (dir.y !== 1)  nextDir = {x:0,y:-1}; break;
    case 'ArrowDown':  case 's': case 'S': if (dir.y !== -1) nextDir = {x:0,y:1};  break;
    case 'ArrowLeft':  case 'a': case 'A': if (dir.x !== 1)  nextDir = {x:-1,y:0}; break;
    case 'ArrowRight': case 'd': case 'D': if (dir.x !== -1) nextDir = {x:1,y:0};  break;
    case 'p': case 'P': if (running) paused = !paused; break;
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});

// Initial draw
ctx.fillStyle = '#0f0f1a';
ctx.fillRect(0, 0, canvas.width, canvas.height);
