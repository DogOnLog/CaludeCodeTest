import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/game.css";

import { createTetrisState, TetrisState } from "./game/tetris/state";
import {
  updateTetris,
  moveLeft,
  moveRight,
  moveDown,
  rotate,
  hardDrop,
  lockAndSpawn,
} from "./game/tetris/update";
import { renderTetris } from "./game/tetris/renderer";
import { triggerShake, showMilestone } from "./game/effects";
import {
  playEat,
  playDeath,
  playMilestone,
  setAudioEnabled,
  isAudioEnabled,
} from "./game/audio";
import {
  getOverlayEls,
  showStart,
  showGameOver,
  hideOverlay,
  renderLeaderboard,
} from "./ui/overlay";
import {
  getHudEls,
  updateScore,
  updateHighScore,
  setAutopilot,
  setRecordGlow,
} from "./ui/hud";
import { submitScore, fetchTop } from "./lib/leaderboard";

// ── DOM ───────────────────────────────────────────────────────────────────────
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const gameWrapper = document.getElementById("game-wrapper") as HTMLElement;
const milestoneEl = document.getElementById("milestone") as HTMLElement;
const audioBtn = document.getElementById(
  "audio-btn",
) as HTMLButtonElement | null;
const crtBtn = document.getElementById("crt-btn") as HTMLButtonElement | null;
const fullscreenBtn = document.getElementById(
  "fullscreen-btn",
) as HTMLButtonElement | null;
const lbBtn = document.getElementById("lb-btn") as HTMLButtonElement | null;
const shortcutsPanel = document.getElementById(
  "shortcuts-panel",
) as HTMLElement | null;
const shortcutsBtn = document.getElementById(
  "shortcuts-btn",
) as HTMLButtonElement | null;
const shortcutsClose = document.getElementById(
  "shortcuts-close",
) as HTMLButtonElement | null;
const overlay = getOverlayEls();
const hud = getHudEls();

// ── rAF loop ─────────────────────────────────────────────────────────────────
let rafId: number | null = null;
let lastTime = 0;
let loopActive = false;

function startLoop(
  st: TetrisState,
  onGameOver: () => void,
  onScore: (s: number, hs: number, lines: number) => void,
): void {
  loopActive = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTime = 0;
  loopActive = true;
  rafId = requestAnimationFrame(function tick(now) {
    if (!loopActive) return;
    if (!lastTime) lastTime = now;
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;
    updateTetris(st, dt, onGameOver, onScore);
    renderTetris(ctx, st);
    rafId = requestAnimationFrame(tick);
  });
}

function stopLoop(): void {
  loopActive = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function flashDeath(onDone: () => void): void {
  let start: number | null = null;
  function frame(now: number) {
    if (!start) start = now;
    const t = (now - start) / 600;
    renderTetris(ctx, state);
    ctx.fillStyle = `rgba(255,77,77,${0.5 * Math.pow(1 - Math.min(t, 1), 2)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (t < 1) requestAnimationFrame(frame);
    else onDone();
  }
  requestAnimationFrame(frame);
}

function handleGameOver(): void {
  stopLoop();
  playDeath();
  flashDeath(() => {
    const isRecord = state.score > 0 && state.score >= state.highScore;
    showGameOver(overlay, state.score, isRecord);
    startIdleDemo();
  });
}

function handleScore(
  score: number,
  highScore: number,
  linesCleared: number,
): void {
  playEat();
  updateScore(hud.score, score);
  updateHighScore(hud.highScore, highScore);
  const isNewRecord = score === highScore && score > 0;
  if (isNewRecord) setRecordGlow(hud.highScoreCard, true);
  if (linesCleared >= 4) {
    playMilestone();
    triggerShake(gameWrapper);
    showMilestone(milestoneEl, score, isNewRecord);
  } else if (isNewRecord) {
    showMilestone(milestoneEl, score, true);
  }
}

// ── Idle demo ─────────────────────────────────────────────────────────────────
function startIdleDemo(): void {
  const demo = createTetrisState();
  demo.running = true;
  demo.autopilot = true;
  const reset = () => {
    Object.assign(demo, createTetrisState());
    demo.running = true;
    demo.autopilot = true;
  };
  startLoop(demo, reset, () => {});
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = createTetrisState();
updateHighScore(hud.highScore, state.highScore);

// ── Game lifecycle ────────────────────────────────────────────────────────────
function startGame(): void {
  state = createTetrisState();
  state.running = true;
  updateScore(hud.score, 0);
  updateHighScore(hud.highScore, state.highScore);
  setRecordGlow(hud.highScoreCard, false);
  setAutopilot(hud.autoBtn, hud.aiBadge, false);
  hideOverlay(overlay);
  startLoop(state, handleGameOver, handleScore);
}

// ── Hard drop (with game-over check) ─────────────────────────────────────────
function doHardDrop(): void {
  hardDrop(state);
  const { linesCleared, points } = lockAndSpawn(state);
  if (points > 0 || linesCleared > 0)
    handleScore(state.score, state.highScore, linesCleared);
  if (state.gameOver) handleGameOver();
}

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (state.running && !state.paused && !state.autopilot) {
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        moveLeft(state);
        break;
      case "ArrowRight":
      case "KeyD":
        moveRight(state);
        break;
      case "ArrowDown":
      case "KeyS":
        moveDown(state);
        state.dropTimer = 0;
        break;
      case "ArrowUp":
      case "KeyW":
        rotate(state, 1);
        break;
      case "KeyZ":
        rotate(state, -1);
        break;
      case "Space":
        doHardDrop();
        break;
    }
    if (
      ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"].includes(
        e.code,
      )
    )
      e.preventDefault();
  }
  if ((e.key === "p" || e.key === "P") && state.running)
    state.paused = !state.paused;
  if (e.key === "?") openShortcuts();
  if (e.key === "Escape") closeShortcuts();
});

// ── Touch ─────────────────────────────────────────────────────────────────────
let touchX: number | null = null,
  touchY: number | null = null;
document.addEventListener(
  "touchstart",
  (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  },
  { passive: true },
);
document.addEventListener(
  "touchend",
  (e) => {
    if (
      touchX === null ||
      touchY === null ||
      !state.running ||
      state.paused ||
      state.autopilot
    )
      return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy > 0) doHardDrop();
      else rotate(state, 1);
    } else {
      if (dx > 0) moveRight(state);
      else moveLeft(state);
    }
  },
  { passive: true },
);

// D-pad
document.getElementById("d-left")?.addEventListener("click", () => {
  if (state.running && !state.paused && !state.autopilot) moveLeft(state);
});
document.getElementById("d-right")?.addEventListener("click", () => {
  if (state.running && !state.paused && !state.autopilot) moveRight(state);
});
document.getElementById("d-rotate")?.addEventListener("click", () => {
  if (state.running && !state.paused && !state.autopilot) rotate(state, 1);
});
document.getElementById("d-down")?.addEventListener("click", () => {
  if (state.running && !state.paused && !state.autopilot) doHardDrop();
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
overlay.saveBtn.addEventListener("click", async () => {
  const name = overlay.playerName.value.trim();
  if (!name) {
    overlay.playerName.focus();
    return;
  }
  overlay.saveBtn.disabled = true;
  overlay.saveBtn.textContent = "...";
  try {
    await submitScore(name, state.score, "leaderboard_tetris");
    renderLeaderboard(overlay, await fetchTop(10, "leaderboard_tetris"));
  } catch {
    overlay.saveBtn.disabled = false;
    overlay.saveBtn.textContent = "SALVA PUNTEGGIO";
  }
});
overlay.playerName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") overlay.saveBtn.click();
});

lbBtn?.addEventListener("click", async () => {
  lbBtn.disabled = true;
  lbBtn.textContent = "...";
  try {
    renderLeaderboard(overlay, await fetchTop(10, "leaderboard_tetris"));
    overlay.icon.textContent = "🏆";
    overlay.title.textContent = "Classifica";
    overlay.msg.textContent = "";
    overlay.overlay.style.display = "flex";
  } finally {
    lbBtn.disabled = false;
    lbBtn.textContent = "🏆 Visualizza Top 10";
  }
});

// ── UI toggles ────────────────────────────────────────────────────────────────
overlay.btn.addEventListener("click", startGame);

hud.autoBtn.addEventListener("click", () => {
  if (!state.running) return;
  state.autopilot = !state.autopilot;
  setAutopilot(hud.autoBtn, hud.aiBadge, state.autopilot);
  hud.autoBtn.setAttribute("aria-pressed", String(state.autopilot));
});

audioBtn?.addEventListener("click", () => {
  const en = !isAudioEnabled();
  setAudioEnabled(en);
  audioBtn.classList.toggle("active", en);
  audioBtn.setAttribute("aria-pressed", String(en));
});

crtBtn?.addEventListener("click", () => {
  gameWrapper.classList.toggle("crt");
  const on = gameWrapper.classList.contains("crt");
  crtBtn.classList.toggle("active", on);
  crtBtn.setAttribute("aria-pressed", String(on));
});

function openShortcuts(): void {
  shortcutsPanel?.classList.remove("hidden");
}
function closeShortcuts(): void {
  shortcutsPanel?.classList.add("hidden");
}
shortcutsBtn?.addEventListener("click", openShortcuts);
shortcutsClose?.addEventListener("click", closeShortcuts);
shortcutsPanel?.addEventListener("click", (e) => {
  if (e.target === shortcutsPanel) closeShortcuts();
});

// ── Fullscreen ────────────────────────────────────────────────────────────────
function syncFullscreenBtn(): void {
  if (!fullscreenBtn) return;
  const isFs = !!document.fullscreenElement;
  fullscreenBtn.textContent = isFs ? "⊡" : "⛶";
  fullscreenBtn.title = isFs ? "Esci dallo schermo intero" : "Schermo intero";
  fullscreenBtn.setAttribute("aria-label", fullscreenBtn.title);
}

fullscreenBtn?.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    gameWrapper.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

document.addEventListener("fullscreenchange", syncFullscreenBtn);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.running) state.paused = true;
});

// ── Boot ──────────────────────────────────────────────────────────────────────
audioBtn?.classList.add("active");
showStart(overlay);
startIdleDemo();
