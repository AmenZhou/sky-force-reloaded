const canvas = document.getElementById('game-canvas');
const overlayStart = document.getElementById('overlay-start');
const overlayGameOver = document.getElementById('overlay-gameover');
const overlayStageClear = document.getElementById('overlay-stage-clear');
const dilationOverlay = document.getElementById('dilation-overlay');
const hitFlash = document.getElementById('hit-flash');
const speedBadge = document.getElementById('speed-badge');
const bossBar = document.getElementById('boss-bar');
const waveBanner = document.getElementById('wave-banner');
const bossNameEl = document.getElementById('boss-name');
const btnStage1 = document.getElementById('btn-stage-1');
const btnArcade = document.getElementById('btn-arcade');
const btnRetry = document.getElementById('btn-retry');
const btnFailMenu = document.getElementById('btn-fail-menu');
const btnClearMenu = document.getElementById('btn-clear-menu');
const btnClearRetry = document.getElementById('btn-clear-retry');
const menuBankedStars = document.getElementById('menu-banked-stars');

const hud = {
  score: document.getElementById('hud-score'),
  scoreChip: document.getElementById('chip-score'),
  stars: document.getElementById('hud-stars'),
  wave: document.getElementById('hud-wave'),
  waveLabel: document.getElementById('hud-wave-label'),
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
  clearStageName: document.getElementById('clear-stage-name'),
  clearScore: document.getElementById('clear-score'),
  clearRunStars: document.getElementById('clear-run-stars'),
  clearBankedStars: document.getElementById('clear-banked-stars'),
};

let lastScore = 0;
let currentMode = 'arcade';
let lastStageId = null;

function refreshMenu() {
  if (menuBankedStars) {
    menuBankedStars.textContent = SkyForceSave.getBankedStars().toLocaleString();
  }
}

function showMenu() {
  if (game) game.stop();
  game = null;
  overlayStart.classList.remove('hidden');
  overlayGameOver.classList.add('hidden');
  overlayStageClear.classList.add('hidden');
  bossBar.classList.add('hidden');
  refreshMenu();
}

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
let bannerHideTimer = 0;

function showBanner(text, kind = 'wave') {
  if (!waveBanner) return;
  waveBanner.textContent = text;
  waveBanner.className = `wave-banner visible ${kind}`;
  clearTimeout(bannerHideTimer);
  bannerHideTimer = setTimeout(() => {
    waveBanner.classList.remove('visible');
  }, 2400);
}

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

function buildGameCallbacks() {
  return {
    onBanner(text, kind) {
      showBanner(text, kind || 'wave');
    },
    onStageStart(stage) {
      if (hud.waveLabel) hud.waveLabel.textContent = 'Section';
      showBanner(stage.subtitle || stage.name, 'stage');
    },
    onWaveStart(wave) {
      if (currentMode === 'arcade' && wave % 5 !== 0) {
        showBanner(`WAVE ${wave}`, 'wave');
      }
    },
    onBossSpawn({ name, stage }) {
      if (bossNameEl) bossNameEl.textContent = name;
      if (!stage) showBanner('BOSS INCOMING', 'boss');
    },
    onBossDefeated({ stageBoss }) {
      showBanner(stageBoss ? 'STAGE CLEAR' : 'BOSS CLEAR', 'clear');
    },
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
      if (hud.waveLabel) {
        hud.waveLabel.textContent = state.mode === 'stage' ? 'Section' : 'Wave';
      }
      updateLives(state.lives, state.maxLives || 3);
      updateShieldBar(state.shieldPct);
      updateWeaponLevel(state.weaponLevel);
      updateCombo(state);
      updateSpeedBadge(state.timeScale);

      if (state.timeScale < 1) dilationOverlay.classList.add('active');
      else dilationOverlay.classList.remove('active');

      if (state.bossActive) {
        bossBar.classList.remove('hidden');
        hud.bossHpFill.style.width = `${state.bossHpPct}%`;
        hud.bossHpText.textContent = `${Math.round(state.bossHpPct)}%`;
        if (bossNameEl && state.bossName) bossNameEl.textContent = state.bossName;
      } else {
        bossBar.classList.add('hidden');
      }
    },
    onGameOver(state) {
      hud.finalScore.textContent = state.score.toLocaleString();
      hud.finalWave.textContent = state.mode === 'stage'
        ? (state.stageName || `Section ${state.wave}`)
        : state.wave;
      overlayGameOver.classList.remove('hidden');
    },
    onStageComplete(result) {
      const banked = SkyForceSave.bankRunStars(result.runStars);
      SkyForceSave.recordStageClear(result.stageId, result.score);
      if (hud.clearStageName) hud.clearStageName.textContent = result.stageName;
      if (hud.clearScore) hud.clearScore.textContent = result.score.toLocaleString();
      if (hud.clearRunStars) hud.clearRunStars.textContent = result.runStars.toLocaleString();
      if (hud.clearBankedStars) hud.clearBankedStars.textContent = banked.toLocaleString();
      overlayStageClear.classList.remove('hidden');
      refreshMenu();
    },
  };
}

function startGame(mode = 'arcade', stageData = null) {
  if (game) game.stop();
  currentMode = mode;
  lastStageId = stageData?.id || null;

  overlayStart.classList.add('hidden');
  overlayGameOver.classList.add('hidden');
  overlayStageClear.classList.add('hidden');
  bossBar.classList.add('hidden');
  dilationOverlay.classList.remove('active');
  lastScore = 0;
  updateShieldBar(100);
  updateWeaponLevel(1);
  updateLives(3, 3);
  updateSpeedBadge(1);
  hud.comboWrap.classList.add('hidden');
  if (hitFlash) hitFlash.classList.remove('visible');
  if (hud.waveLabel) hud.waveLabel.textContent = mode === 'stage' ? 'Section' : 'Wave';

  game = new Game(canvas, buildGameCallbacks(), { mode, stageData });
  if (mode === 'arcade') showBanner('WAVE 1', 'wave');
  game.start();
}

btnStage1.addEventListener('click', () => {
  const data = window.SKY_FORCE_STAGES?.['stage-01'];
  if (!data) return;
  startGame('stage', data);
});

btnArcade.addEventListener('click', () => startGame('arcade'));

btnRetry.addEventListener('click', () => {
  if (currentMode === 'stage' && lastStageId === 1) {
    startGame('stage', window.SKY_FORCE_STAGES?.['stage-01']);
  } else {
    startGame('arcade');
  }
});

btnFailMenu.addEventListener('click', showMenu);
btnClearMenu.addEventListener('click', showMenu);
btnClearRetry.addEventListener('click', () => {
  startGame('stage', window.SKY_FORCE_STAGES?.['stage-01']);
});

refreshMenu();

window.__SKY_FORCE__ = {
  getState: () => {
    if (!game) return null;
    return {
      running: game.running,
      mode: game.mode,
      score: game.score,
      runStars: game.runStars,
      wave: game.wave,
      lives: game.lives,
      maxLives: game.maxLives,
      shieldPct: Math.round(game.player.shieldPct * 100),
      weaponLevel: game.player.weaponLevel,
      combo: game.combo,
      timeScale: game.timeScale,
      bossActive: game.bossActive,
      bossHpPct: game.bossHpPct,
      bossName: game.boss?.name || null,
      playerX: game.player.x,
      playerY: game.player.y,
      enemyBullets: game.bullets.enemyBullets.map((b) => ({
        x: Math.round(b.x),
        y: Math.round(b.y),
        vx: Math.round(b.vx),
        vy: Math.round(b.vy),
      })),
      enemies: game.enemies.list
        .filter((e) => e.alive)
        .map((e) => ({
          x: Math.round(e.x),
          y: Math.round(e.y),
          radius: e.radius,
          type: e.type,
        })),
      boss: game.boss?.alive
        ? {
          x: Math.round(game.boss.x),
          y: Math.round(game.boss.y),
          radius: game.boss.radius,
          hpPct: Math.round(game.boss.hpPct),
        }
        : null,
      powerups: game.powerups.list
        .filter((p) => p.active)
        .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), type: p.type })),
    };
  },
  startArcade: () => startGame('arcade'),
  startStage1: () => startGame('stage', window.SKY_FORCE_STAGES?.['stage-01']),
};
