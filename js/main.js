import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const overlayStart = document.getElementById('overlay-start');
const overlayGameOver = document.getElementById('overlay-gameover');
const btnStart = document.getElementById('btn-start');
const btnRetry = document.getElementById('btn-retry');

const hud = {
  score: document.getElementById('hud-score'),
  wave: document.getElementById('hud-wave'),
  lives: document.getElementById('hud-lives'),
  shield: document.getElementById('hud-shield'),
  weapon: document.getElementById('hud-weapon'),
  finalScore: document.getElementById('final-score'),
  finalWave: document.getElementById('final-wave'),
};

function resizeCanvas() {
  const maxW = Math.min(window.innerWidth - 16, 480);
  const maxH = Math.min(window.innerHeight - 80, 854);
  const aspect = 9 / 16;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  canvas.width = 360;
  canvas.height = 640;
  canvas.style.width = `${Math.round(w)}px`;
  canvas.style.height = `${Math.round(h)}px`;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let game = null;

function startGame() {
  overlayStart.classList.add('hidden');
  overlayGameOver.classList.add('hidden');
  game = new Game(canvas, {
    onHudUpdate(state) {
      hud.score.textContent = state.score.toLocaleString();
      hud.wave.textContent = state.wave;
      hud.lives.textContent = state.lives;
      hud.shield.textContent = `${Math.round(state.shieldPct)}%`;
      hud.weapon.textContent = `Lv ${state.weaponLevel}`;
    },
    onGameOver(state) {
      hud.finalScore.textContent = state.score.toLocaleString();
      hud.finalWave.textContent = state.wave;
      overlayGameOver.classList.remove('hidden');
    },
  });
  game.start();
}

btnStart.addEventListener('click', startGame);
btnRetry.addEventListener('click', startGame);
