const canvas = document.getElementById('game-canvas');
const gameShell = document.getElementById('game-shell');
const overlayStart = document.getElementById('overlay-start');
const overlayGameOver = document.getElementById('overlay-gameover');
const dilationOverlay = document.getElementById('dilation-overlay');
const bossBar = document.getElementById('boss-bar');
const btnStart = document.getElementById('btn-start');
const btnRetry = document.getElementById('btn-retry');

const hud = {
  score: document.getElementById('hud-score'),
  stars: document.getElementById('hud-stars'),
  wave: document.getElementById('hud-wave'),
  lives: document.getElementById('hud-lives'),
  shield: document.getElementById('hud-shield'),
  weapon: document.getElementById('hud-weapon'),
  comboWrap: document.getElementById('hud-combo-wrap'),
  combo: document.getElementById('hud-combo'),
  bossHpFill: document.getElementById('boss-hp-fill'),
  bossHpText: document.getElementById('boss-hp-text'),
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
  if (game) game.stop();
  overlayStart.classList.add('hidden');
  overlayGameOver.classList.add('hidden');
  bossBar.classList.add('hidden');
  dilationOverlay.classList.remove('active');

  game = new Game(canvas, {
    onHudUpdate(state) {
      hud.score.textContent = state.score.toLocaleString();
      hud.stars.textContent = state.runStars.toLocaleString();
      hud.wave.textContent = state.wave;
      hud.lives.textContent = state.lives;
      hud.shield.textContent = `${Math.round(state.shieldPct)}%`;
      hud.weapon.textContent = `Lv ${state.weaponLevel}`;

      if (state.combo > 1.05) {
        hud.comboWrap.classList.remove('hidden');
        hud.combo.textContent = `×${state.combo.toFixed(1)}`;
      } else {
        hud.comboWrap.classList.add('hidden');
      }

      if (state.timeScale < 1) {
        dilationOverlay.classList.add('active');
      } else {
        dilationOverlay.classList.remove('active');
      }

      if (state.bossActive) {
        bossBar.classList.remove('hidden');
        hud.bossHpFill.style.width = `${state.bossHpPct}%`;
        hud.bossHpText.textContent = `${Math.round(state.bossHpPct)}%`;
      } else {
        bossBar.classList.add('hidden');
      }
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

window.__SKY_FORCE__ = {
  getState: () => (game ? {
    score: game.score,
    runStars: game.runStars,
    wave: game.wave,
    combo: game.combo,
    timeScale: game.timeScale,
  } : null),
};
