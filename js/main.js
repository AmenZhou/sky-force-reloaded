const canvas = document.getElementById('game-canvas');
const overlayStart = document.getElementById('overlay-start');
const overlayGameOver = document.getElementById('overlay-gameover');
const dilationOverlay = document.getElementById('dilation-overlay');
const hitFlash = document.getElementById('hit-flash');
const speedBadge = document.getElementById('speed-badge');
const bossBar = document.getElementById('boss-bar');
const btnStart = document.getElementById('btn-start');
const btnRetry = document.getElementById('btn-retry');

const hud = {
  score: document.getElementById('hud-score'),
  scoreChip: document.getElementById('chip-score'),
  stars: document.getElementById('hud-stars'),
  wave: document.getElementById('hud-wave'),
  lives: document.getElementById('hud-lives'),
  livesHearts: document.getElementById('hud-lives-hearts'),
  shield: document.getElementById('hud-shield'),
  shieldFill: document.getElementById('hud-shield-fill'),
  weapon: document.getElementById('hud-weapon'),
  weaponWrap: document.getElementById('hud-weapon-wrap'),
  comboWrap: document.getElementById('hud-combo-wrap'),
  combo: document.getElementById('hud-combo'),
  bossHpFill: document.getElementById('boss-hp-fill'),
  bossHpText: document.getElementById('boss-hp-text'),
  finalScore: document.getElementById('final-score'),
  finalWave: document.getElementById('final-wave'),
};

let lastScore = 0;

function updateShieldBar(pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  hud.shield.textContent = `${Math.round(clamped)}%`;
  hud.shieldFill.style.width = `${clamped}%`;
  hud.shieldFill.classList.remove('low', 'critical');
  if (clamped <= 25) hud.shieldFill.classList.add('critical');
  else if (clamped <= 50) hud.shieldFill.classList.add('low');
}

function updateWeaponLevel(level) {
  hud.weapon.textContent = `Lv ${level}`;
  hud.weaponWrap.className = `status-pill weapon-lv-${Math.min(4, Math.max(1, level))}`;
}

function updateLives(lives, maxLives = 3) {
  hud.lives.textContent = lives;
  if (!hud.livesHearts) return;
  hud.livesHearts.innerHTML = '';
  for (let i = 0; i < maxLives; i += 1) {
    const heart = document.createElement('span');
    heart.className = i < lives ? 'heart full' : 'heart empty';
    heart.textContent = '♥';
    hud.livesHearts.appendChild(heart);
  }
}

function updateSpeedBadge(timeScale) {
  if (!speedBadge) return;
  if (timeScale < 1) {
    speedBadge.textContent = `${Math.round(timeScale * 100)}% SLOW`;
    speedBadge.classList.add('active');
  } else {
    speedBadge.textContent = '100%';
    speedBadge.classList.remove('active');
  }
}

let hitToastTimer = 0;
function showHitToast(lostLife) {
  if (!hitFlash) return;
  hitFlash.textContent = lostLife ? 'LIFE LOST!' : 'HIT!';
  hitFlash.classList.add('visible');
  clearTimeout(hitToastTimer);
  hitToastTimer = setTimeout(() => hitFlash.classList.remove('visible'), 600);
}
function updateCombo(state) {
  if (state.combo > 1.05) {
    hud.comboWrap.classList.remove('hidden');
    hud.combo.textContent = `×${state.combo.toFixed(1)}`;
    hud.comboWrap.classList.remove('combo-hot', 'combo-max');
    if (state.combo >= 3.5) hud.comboWrap.classList.add('combo-max');
    else if (state.combo >= 2) hud.comboWrap.classList.add('combo-hot');
  } else {
    hud.comboWrap.classList.add('hidden');
    hud.comboWrap.classList.remove('combo-hot', 'combo-max');
  }
}

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
  lastScore = 0;
  updateShieldBar(100);
  updateWeaponLevel(1);
  updateLives(3, 3);
  updateSpeedBadge(1);
  hud.comboWrap.classList.add('hidden');
  if (hitFlash) hitFlash.classList.remove('visible');

  game = new Game(canvas, {
    onPlayerHit({ lostLife }) {
      showHitToast(lostLife);
    },
    onHudUpdate(state) {
      hud.score.textContent = state.score.toLocaleString();
      if (state.score > lastScore) {
        hud.scoreChip.classList.remove('pop');
        void hud.scoreChip.offsetWidth;
        hud.scoreChip.classList.add('pop');
      }
      lastScore = state.score;

      hud.stars.textContent = state.runStars.toLocaleString();
      hud.wave.textContent = state.wave;
      updateLives(state.lives, state.maxLives || 3);
      updateShieldBar(state.shieldPct);
      updateWeaponLevel(state.weaponLevel);
      updateCombo(state);
      updateSpeedBadge(state.timeScale);

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
    running: game.running,
    score: game.score,
    runStars: game.runStars,
    wave: game.wave,
    lives: game.lives,
    maxLives: game.maxLives,
    shieldPct: Math.round(game.player.shieldPct * 100),
    weaponLevel: game.player.weaponLevel,
    combo: game.combo,
    timeScale: game.timeScale,
  } : null),
};
