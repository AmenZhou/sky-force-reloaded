const canvas = document.getElementById('game-canvas');
const overlayStart = document.getElementById('overlay-start');
const overlayHangar = document.getElementById('overlay-hangar');
const overlayStageMap = document.getElementById('overlay-stage-map');
const overlayGameOver = document.getElementById('overlay-gameover');
const overlayStageClear = document.getElementById('overlay-stage-clear');
const dilationOverlay = document.getElementById('dilation-overlay');
const hitFlash = document.getElementById('hit-flash');
const speedBadge = document.getElementById('speed-badge');
const abilityBar = document.getElementById('ability-bar');
const bossBar = document.getElementById('boss-bar');
const waveBanner = document.getElementById('wave-banner');
const bossNameEl = document.getElementById('boss-name');
const menuBankedStars = document.getElementById('menu-banked-stars');
const hangarStars = document.getElementById('hangar-stars');
const hangarModules = document.getElementById('hangar-modules');
const stageMapList = document.getElementById('stage-map-list');
const clearMedals = document.getElementById('clear-medals');

const btnHangar = document.getElementById('btn-hangar');
const btnStages = document.getElementById('btn-stages');
const btnArcade = document.getElementById('btn-arcade');
const btnHangarBack = document.getElementById('btn-hangar-back');
const btnStagesBack = document.getElementById('btn-stages-back');
const btnRetry = document.getElementById('btn-retry');
const btnFailMenu = document.getElementById('btn-fail-menu');
const btnClearMenu = document.getElementById('btn-clear-menu');
const btnClearRetry = document.getElementById('btn-clear-retry');
const btnAbilityLaser = document.getElementById('btn-ability-laser');
const btnAbilityShield = document.getElementById('btn-ability-shield');
const btnAbilityBomb = document.getElementById('btn-ability-bomb');
const chargeLaser = document.getElementById('charge-laser');
const chargeShield = document.getElementById('charge-shield');
const chargeBomb = document.getElementById('charge-bomb');

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
let currentStageId = null;
let currentDifficulty = 'normal';
let game = null;

function refreshMenu() {
  const stars = SkyForceSave.getBankedStars();
  if (menuBankedStars) menuBankedStars.textContent = stars.toLocaleString();
  if (hangarStars) hangarStars.textContent = stars.toLocaleString();
}

function hideAllOverlays() {
  overlayStart.classList.add('hidden');
  overlayHangar.classList.add('hidden');
  overlayStageMap.classList.add('hidden');
  overlayGameOver.classList.add('hidden');
  overlayStageClear.classList.add('hidden');
  abilityBar.classList.add('hidden');
}

function showMenu() {
  if (game) game.stop();
  game = null;
  hideAllOverlays();
  overlayStart.classList.remove('hidden');
  bossBar.classList.add('hidden');
  refreshMenu();
}

function renderHangar() {
  const save = SkyForceSave.load();
  hangarStars.textContent = save.bankedStars.toLocaleString();
  hangarModules.innerHTML = '';
  const cfg = HANGAR_CONFIG;

  HangarSystem.moduleIds().forEach((id) => {
    const mod = cfg.modules[id];
    const level = HangarSystem.getLevel(save, id);
    const cost = HangarSystem.upgradeCost(save, id);
    const maxed = level >= mod.maxLevel;
    const locked = mod.unlock > 0 && !HangarSystem.isModuleUnlocked(save, id) && level === 0;

    const card = document.createElement('div');
    card.className = 'hangar-card';
    card.innerHTML = `
      <div class="hangar-card-head">
        <span class="hangar-icon">${mod.icon}</span>
        <div>
          <div class="hangar-name">${mod.label}</div>
          <div class="hangar-desc">${mod.desc}</div>
        </div>
      </div>
      <div class="hangar-level">Lv ${level} / ${mod.maxLevel}</div>
    `;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hangar-upgrade-btn';
    if (maxed) {
      btn.textContent = 'MAX';
      btn.disabled = true;
    } else if (cost != null) {
      btn.textContent = locked ? `UNLOCK ${cost.toLocaleString()} ★` : `UPGRADE ${cost.toLocaleString()} ★`;
      btn.disabled = save.bankedStars < cost;
      btn.addEventListener('click', () => {
        const s = SkyForceSave.load();
        const result = HangarSystem.purchaseUpgrade(s, id);
        if (result.ok) {
          SkyForceSave.write(s);
          renderHangar();
          refreshMenu();
        }
      });
    }
    card.appendChild(btn);
    hangarModules.appendChild(card);
  });
}

function renderStageMap() {
  stageMapList.innerHTML = '';
  const stage = window.SKY_FORCE_STAGES?.['stage-01'];
  if (!stage) return;

  const card = document.createElement('div');
  card.className = 'stage-card';

  const diffRow = document.createElement('div');
  diffRow.className = 'difficulty-row';
  const unlocked = SkyForceSave.unlockedDifficulties(stage.id);
  let selectedDiff = unlocked.includes(currentDifficulty) ? currentDifficulty : 'normal';

  HANGAR_CONFIG.difficulty.order.forEach((d) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `diff-btn${d === selectedDiff ? ' active' : ''}${unlocked.includes(d) ? '' : ' locked'}`;
    btn.textContent = HANGAR_CONFIG.difficulty.labels[d];
    btn.disabled = !unlocked.includes(d);
    btn.addEventListener('click', () => {
      selectedDiff = d;
      currentDifficulty = d;
      renderStageMap();
    });
    diffRow.appendChild(btn);
  });

  const medalRow = document.createElement('div');
  medalRow.className = 'medal-row';
  HANGAR_CONFIG.medals.forEach((m) => {
    const earned = SkyForceSave.getStageMedals(stage.id, selectedDiff).includes(m.id);
    const chip = document.createElement('span');
    chip.className = `medal-chip${earned ? ' earned' : ''}`;
    chip.title = m.label;
    chip.textContent = m.short;
    medalRow.appendChild(chip);
  });

  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'btn-launch title-font w-full py-3 rounded-xl text-sm mt-4';
  launch.textContent = `LAUNCH — ${stage.name.toUpperCase()}`;
  launch.addEventListener('click', () => {
    currentDifficulty = selectedDiff;
    startGame('stage', stage, stage.id, selectedDiff);
  });

  card.innerHTML = `
    <h3 class="stage-card-title">${stage.name}</h3>
    <p class="stage-card-sub">${stage.subtitle}</p>
  `;
  card.appendChild(diffRow);
  card.appendChild(medalRow);
  card.appendChild(launch);
  stageMapList.appendChild(card);
}

function renderClearMedals(medalIds) {
  if (!clearMedals) return;
  clearMedals.innerHTML = '';
  HANGAR_CONFIG.medals.forEach((m) => {
    const earned = medalIds.includes(m.id);
    const chip = document.createElement('span');
    chip.className = `medal-chip${earned ? ' earned' : ''}`;
    chip.textContent = earned ? `✓ ${m.short}` : m.short;
    clearMedals.appendChild(chip);
  });
}

function updateAbilityBar(charges) {
  if (!charges || !game?.running) {
    abilityBar.classList.add('hidden');
    return;
  }
  chargeLaser.textContent = charges.laser ?? 0;
  chargeShield.textContent = charges.shield ?? 0;
  chargeBomb.textContent = charges.bomb ?? 0;
  const any = (charges.laser + charges.shield + charges.bomb) > 0;
  abilityBar.classList.toggle('hidden', !any);
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
    speedBadge.textContent = `${Math.round(timeScale * 100)}% FOCUS`;
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
  bannerHideTimer = setTimeout(() => waveBanner.classList.remove('visible'), 2400);
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
  } else {
    hud.comboWrap.classList.add('hidden');
  }
}

function resizeCanvas() {
  const maxW = Math.min(window.innerWidth - 16, 480);
  const maxH = Math.min(window.innerHeight - 80, 854);
  const aspect = 9 / 16;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  canvas.width = 360;
  canvas.height = 640;
  canvas.style.width = `${Math.round(w)}px`;
  canvas.style.height = `${Math.round(h)}px`;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function buildCallbacks() {
  return {
    onBanner(text, kind) { showBanner(text, kind || 'wave'); },
    onStageStart(stage) {
      if (hud.waveLabel) hud.waveLabel.textContent = 'Section';
      showBanner(stage.subtitle || stage.name, 'stage');
    },
    onWaveStart(wave) {
      if (currentMode === 'arcade' && wave % 5 !== 0) showBanner(`WAVE ${wave}`, 'wave');
    },
    onBossSpawn({ name, stage }) {
      if (bossNameEl) bossNameEl.textContent = name;
      if (!stage) showBanner('BOSS INCOMING', 'boss');
    },
    onBossDefeated({ stageBoss }) {
      showBanner(stageBoss ? 'STAGE CLEAR' : 'BOSS CLEAR', 'clear');
    },
    onCheckpointPassed(score) {
      showBanner(`PASSED FRIEND ${Math.round(score / 1000)}k!`, 'clear');
    },
    onPlayerHit({ lostLife }) { showHitToast(lostLife); },
    onAbilityUsed() {
      if (game) updateAbilityBar(game.runCharges);
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
      if (hud.waveLabel) hud.waveLabel.textContent = state.mode === 'stage' ? 'Section' : 'Wave';
      updateLives(state.lives, state.maxLives || 3);
      updateShieldBar(state.shieldPct);
      updateWeaponLevel(state.weaponLevel);
      updateCombo(state);
      updateSpeedBadge(state.timeScale);
      updateAbilityBar(state.runCharges);
      dilationOverlay.classList.toggle('active', state.timeScale < 1);
      if (state.bossActive) {
        bossBar.classList.remove('hidden');
        hud.bossHpFill.style.width = `${state.bossHpPct}%`;
        hud.bossHpText.textContent = `${Math.round(state.bossHpPct)}%`;
        if (bossNameEl && state.bossName) bossNameEl.textContent = state.bossName;
      } else bossBar.classList.add('hidden');
    },
    onGameOver(state) {
      hud.finalScore.textContent = state.score.toLocaleString();
      hud.finalWave.textContent = state.mode === 'stage'
        ? (state.stageName || `Section ${state.wave}`)
        : state.wave;
      overlayGameOver.classList.remove('hidden');
      abilityBar.classList.add('hidden');
    },
    onStageComplete(result) {
      const cfg = HANGAR_CONFIG;
      const starMult = cfg.difficulty.starMult[result.difficulty] || 1;
      const medalBonus = result.medals.length * cfg.stagePayout.medalBonus;
      const rescueBonus = (result.rescued || 0) * cfg.stagePayout.rescueBonus;
      const toBank = Math.round(result.runStars * starMult) + medalBonus + rescueBonus;
      const banked = SkyForceSave.bankRunStars(toBank);
      SkyForceSave.recordStageMedals(result.stageId, result.difficulty, result.medals);
      SkyForceSave.recordStageClear(result.stageId, result.score, result.difficulty);

      if (hud.clearStageName) hud.clearStageName.textContent = result.stageName;
      if (hud.clearScore) hud.clearScore.textContent = result.score.toLocaleString();
      if (hud.clearRunStars) hud.clearRunStars.textContent = `${toBank.toLocaleString()} (${result.runStars} base)`;
      if (hud.clearBankedStars) hud.clearBankedStars.textContent = banked.toLocaleString();
      renderClearMedals(result.medals);
      overlayStageClear.classList.remove('hidden');
      abilityBar.classList.add('hidden');
      refreshMenu();
    },
  };
}

function startGame(mode = 'arcade', stageData = null, stageId = null, difficulty = 'normal') {
  if (game) game.stop();
  currentMode = mode;
  currentStageId = stageId;
  currentDifficulty = difficulty;

  hideAllOverlays();
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

  const save = SkyForceSave.load();
  const hangarStats = HangarSystem.statsFromSave(save);

  game = new Game(canvas, buildCallbacks(), {
    mode,
    stageData,
    difficulty,
    hangarStats,
    friendCheckpoint: save.friendCheckpointScore,
  });

  if (mode === 'arcade') showBanner('WAVE 1', 'wave');
  updateAbilityBar(game.runCharges);
  game.start();
}

btnHangar.addEventListener('click', () => {
  hideAllOverlays();
  overlayHangar.classList.remove('hidden');
  renderHangar();
});

btnStages.addEventListener('click', () => {
  hideAllOverlays();
  overlayStageMap.classList.remove('hidden');
  renderStageMap();
});

btnArcade.addEventListener('click', () => startGame('arcade'));
btnHangarBack.addEventListener('click', showMenu);
btnStagesBack.addEventListener('click', showMenu);

btnRetry.addEventListener('click', () => {
  if (currentMode === 'stage' && currentStageId === 1) {
    startGame('stage', window.SKY_FORCE_STAGES?.['stage-01'], 1, currentDifficulty);
  } else startGame('arcade');
});

btnClearRetry.addEventListener('click', () => {
  startGame('stage', window.SKY_FORCE_STAGES?.['stage-01'], 1, currentDifficulty);
});

btnFailMenu.addEventListener('click', showMenu);
btnClearMenu.addEventListener('click', showMenu);

btnAbilityLaser.addEventListener('click', () => game?.useAbility('laser'));
btnAbilityShield.addEventListener('click', () => game?.useAbility('shield'));
btnAbilityBomb.addEventListener('click', () => game?.useAbility('bomb'));

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
        x: Math.round(b.x), y: Math.round(b.y), vx: Math.round(b.vx), vy: Math.round(b.vy),
      })),
      enemies: game.enemies.list.filter((e) => e.alive).map((e) => ({
        x: Math.round(e.x), y: Math.round(e.y), radius: e.radius, type: e.type,
      })),
      boss: game.boss?.alive ? {
        x: Math.round(game.boss.x), y: Math.round(game.boss.y),
        radius: game.boss.radius, hpPct: Math.round(game.boss.hpPct),
      } : null,
      powerups: game.powerups.list.filter((p) => p.active).map((p) => ({
        x: Math.round(p.x), y: Math.round(p.y), type: p.type,
      })),
    };
  },
  startArcade: () => startGame('arcade'),
  startStage1: (diff = 'normal') => startGame('stage', window.SKY_FORCE_STAGES?.['stage-01'], 1, diff),
};
