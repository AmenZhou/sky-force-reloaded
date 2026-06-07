const canvas = document.getElementById('game-canvas');
const overlayStart = document.getElementById('overlay-start');
const overlayHangar = document.getElementById('overlay-hangar');
const overlayStageMap = document.getElementById('overlay-stage-map');
const overlayGameOver = document.getElementById('overlay-gameover');
const overlayStageClear = document.getElementById('overlay-stage-clear');
const dilationOverlay = document.getElementById('dilation-overlay');
const hitFlash = document.getElementById('hit-flash');
const niceFeedback = document.getElementById('nice-feedback');
const chipHostages = document.getElementById('chip-hostages');
const speedBadge = document.getElementById('speed-badge');
const abilityBar = document.getElementById('ability-bar');
const bossBar = document.getElementById('boss-bar');
const waveBanner = document.getElementById('wave-banner');
const medalSlideBanner = document.getElementById('medal-slide-banner');
const medalRunTrack = document.getElementById('medal-run-track');
const bossNameEl = document.getElementById('boss-name');
const menuBankedStars = document.getElementById('menu-banked-stars');
const hangarStars = document.getElementById('hangar-stars');
const hangarModules = document.getElementById('hangar-modules');
const hangarFleet = document.getElementById('hangar-fleet');
const hangarAlbum = document.getElementById('hangar-album');
const tabUpgrades = document.getElementById('tab-upgrades');
const tabFleet = document.getElementById('tab-fleet');
const tabAlbum = document.getElementById('tab-album');
const panelUpgrades = document.getElementById('hangar-panel-upgrades');
const panelFleet = document.getElementById('hangar-panel-fleet');
const panelAlbum = document.getElementById('hangar-panel-album');
const clearNewLoot = document.getElementById('clear-new-loot');
const failLostLoot = document.getElementById('fail-lost-loot');
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
const btnClearNext = document.getElementById('btn-clear-next');
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
  hostages: document.getElementById('hud-hostages'),
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
  if (btnClearNext) btnClearNext.classList.add('hidden');
  abilityBar.classList.add('hidden');
  if (medalRunTrack) medalRunTrack.classList.add('hidden');
}

function showMenu() {
  if (game) game.stop();
  game = null;
  hideAllOverlays();
  overlayStart.classList.remove('hidden');
  bossBar.classList.add('hidden');
  refreshMenu();
}

function showHangarTab(tab) {
  const tabs = { upgrades: tabUpgrades, fleet: tabFleet, album: tabAlbum };
  const panels = { upgrades: panelUpgrades, fleet: panelFleet, album: panelAlbum };
  Object.keys(tabs).forEach((k) => {
    tabs[k]?.classList.toggle('active', k === tab);
    panels[k]?.classList.toggle('hidden', k !== tab);
  });
  if (tab === 'upgrades') renderHangar();
  if (tab === 'fleet') renderFleet();
  if (tab === 'album') renderAlbum();
}

function renderFleet() {
  if (!hangarFleet) return;
  const save = SkyForceSave.load();
  const migrated = CollectionSystem.migrateLegacyParts(save);
  if (migrated.converted > 0) SkyForceSave.write(save);
  if (hangarStars) hangarStars.textContent = save.bankedStars.toLocaleString();
  hangarFleet.innerHTML = '';
  if (migrated.converted > 0) {
    const note = document.createElement('p');
    note.className = 'text-amber-200/90 text-xs mb-3 px-1';
    note.textContent = `Converted ${migrated.converted} old ship part(s) → +${migrated.stars.toLocaleString()} ★. Ships unlock with stars below — not parts.`;
    hangarFleet.appendChild(note);
  }
  const equipped = CollectionSystem.equippedShip(save);
  Object.values(COLLECTION_CONFIG.ships).forEach((ship) => {
    const unlocked = CollectionSystem.isShipUnlocked(save, ship.id);
    const cost = CollectionSystem.shipUnlockCost(ship.id);
    const card = document.createElement('div');
    card.className = `fleet-card${equipped === ship.id ? ' equipped' : ''}${unlocked ? '' : ' locked'}`;
    card.innerHTML = `
      <div class="fleet-head">
        <span class="fleet-icon">${ship.icon}</span>
        <div>
          <div class="fleet-name">${ship.name}</div>
          <div class="fleet-tag">${ship.tagline}</div>
        </div>
      </div>
      <div class="fleet-parts">${cost > 0
        ? (unlocked ? 'Unlocked with ★' : `Needs ${cost.toLocaleString()} ★ to unlock`)
        : 'Starter ship — always available'}</div>
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hangar-upgrade-btn';
    if (equipped === ship.id) {
      btn.textContent = 'EQUIPPED';
      btn.disabled = true;
    } else if (unlocked) {
      btn.textContent = 'EQUIP';
      btn.addEventListener('click', () => {
        const s = SkyForceSave.load();
        s.equippedShip = ship.id;
        SkyForceSave.write(s);
        renderFleet();
      });
    } else {
      btn.textContent = `UNLOCK ${cost.toLocaleString()} ★`;
      btn.disabled = save.bankedStars < cost;
      btn.addEventListener('click', () => {
        const s = SkyForceSave.load();
        const result = CollectionSystem.purchaseShip(s, ship.id);
        if (result.ok) {
          SkyForceSave.write(s);
          renderFleet();
          refreshMenu();
          if (hangarStars) hangarStars.textContent = s.bankedStars.toLocaleString();
        }
      });
    }
    card.appendChild(btn);
    hangarFleet.appendChild(card);
  });
}

function renderAlbum() {
  if (!hangarAlbum) return;
  const save = SkyForceSave.load();
  hangarAlbum.innerHTML = '';
  const owned = new Set(CollectionSystem.ownedCards(save));
  const pending = new Set(save.runUnconfirmed?.cards || []);
  COLLECTION_CONFIG.cards.permanent.forEach((card) => {
    const cardEl = document.createElement('div');
    const isOwned = owned.has(card.id);
    const isPending = pending.has(card.id);
    cardEl.className = `album-card${isOwned ? ' owned' : ''}${isPending ? ' unconfirmed' : ''}`;
    cardEl.innerHTML = `
      <span class="album-num">#${String(card.num).padStart(2, '0')}</span>
      <div>
        <div class="album-name">${card.name}${isPending ? ' (unconfirmed)' : ''}</div>
        <div class="album-desc">${card.desc}</div>
      </div>
    `;
    hangarAlbum.appendChild(cardEl);
  });
  const hint = document.createElement('p');
  hint.className = 'text-slate-500 text-xs mt-3';
  hint.textContent = 'Cards drop from elites and crates. Unlock ships with banked ★ in the Fleet tab — parts no longer gate ships.';
  hangarAlbum.appendChild(hint);
}

function hangarModuleStatLine(moduleId, level) {
  if (moduleId === 'missiles') {
    if (level <= 0) return 'Locked — following salvos track ground targets';
    const salvo = 1 + Math.floor(level / 2);
    const interval = Math.max(1.2, 2.8 - level * 0.15);
    return `${salvo} missiles every ${interval.toFixed(1)}s`;
  }
  if (moduleId === 'wings' && level > 0) {
    return `${Math.floor(level / 2)} side-cannon tier(s)`;
  }
  if (moduleId === 'magnet' && level > 0) {
    return `${40 + level * 12}px pickup radius`;
  }
  return '';
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

    const statLine = hangarModuleStatLine(id, level);
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
      <div class="hangar-level">Lv ${level} / ${mod.maxLevel}${statLine ? ` · ${statLine}` : ''}</div>
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

function getStageById(stageId) {
  const key = `stage-${String(stageId).padStart(2, '0')}`;
  return window.SKY_FORCE_STAGES?.[key] || null;
}

function renderStageMap() {
  stageMapList.innerHTML = '';
  const order = window.SKY_FORCE_STAGE_ORDER || ['stage-01'];
  order.forEach((stageKey) => {
    const stage = window.SKY_FORCE_STAGES?.[stageKey];
    if (!stage) return;

    const locked = !SkyForceSave.isStageUnlocked(stage.id);
    const card = document.createElement('div');
    card.className = `stage-card${locked ? ' locked' : ''}`;

    const diffRow = document.createElement('div');
    diffRow.className = 'difficulty-row';
    const unlocked = SkyForceSave.unlockedDifficulties(stage.id);
    let selectedDiff = unlocked.includes(currentDifficulty) ? currentDifficulty : 'normal';

    HANGAR_CONFIG.difficulty.order.forEach((d) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `diff-btn${d === selectedDiff ? ' active' : ''}${unlocked.includes(d) ? '' : ' locked'}`;
      btn.textContent = HANGAR_CONFIG.difficulty.labels[d];
      btn.disabled = locked || !unlocked.includes(d);
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

    card.innerHTML = `
      <h3 class="stage-card-title">${locked ? '🔒 ' : ''}${stage.name}</h3>
      <p class="stage-card-sub">${locked ? 'Clear previous stage to unlock' : stage.subtitle}</p>
    `;
    card.appendChild(diffRow);
    card.appendChild(medalRow);

    if (!locked) {
      const launch = document.createElement('button');
      launch.type = 'button';
      launch.className = 'btn-launch title-font w-full py-3 rounded-xl text-sm mt-4';
      const ship = CollectionSystem.config().ships[CollectionSystem.equippedShip(SkyForceSave.load())];
      launch.textContent = `LAUNCH — ${stage.name.toUpperCase()} (${ship?.name || 'Enforcer'})`;
      launch.addEventListener('click', () => {
        currentDifficulty = selectedDiff;
        startGame('stage', stage, stage.id, selectedDiff);
      });
      card.appendChild(launch);
    }

    stageMapList.appendChild(card);
  });
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

let medalSlideTimer = 0;

function showMedalSlide(text, failed = false) {
  if (!medalSlideBanner) return;
  medalSlideBanner.textContent = text;
  medalSlideBanner.className = `medal-slide-banner visible${failed ? ' fail' : ''}`;
  clearTimeout(medalSlideTimer);
  medalSlideTimer = setTimeout(() => medalSlideBanner.classList.remove('visible'), 2600);
}

function updateMedalRunTrack(state) {
  if (!medalRunTrack || !state) return;
  medalRunTrack.querySelectorAll('.medal-run-chip').forEach((chip) => {
    const id = chip.dataset.medal;
    const s = state[id];
    chip.classList.remove('pending', 'earned', 'failed', 'noHit');
    if (!s) {
      chip.classList.add('pending');
      return;
    }
    if (s.earned) chip.classList.add('earned');
    else if (s.failed) {
      chip.classList.add('failed');
      if (id === 'noHit') chip.classList.add('noHit');
    } else chip.classList.add('pending');
  });
}

function showBanner(text, kind = 'wave') {
  if (!waveBanner) return;
  waveBanner.textContent = text;
  waveBanner.className = `wave-banner visible ${kind}`;
  clearTimeout(bannerHideTimer);
  bannerHideTimer = setTimeout(() => waveBanner.classList.remove('visible'), 2400);
}

function formatSkyScore(n) {
  const s = String(Math.max(0, Math.floor(n)));
  if (s.length <= 6) {
    const padded = s.padStart(6, '0');
    return `${padded.slice(0, 3)} ${padded.slice(3)}`;
  }
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

let niceFeedbackTimer = 0;

function showNiceFeedback(text) {
  if (!niceFeedback || !text) return;
  niceFeedback.textContent = text;
  niceFeedback.classList.add('visible');
  clearTimeout(niceFeedbackTimer);
  niceFeedbackTimer = setTimeout(() => niceFeedback.classList.remove('visible'), 900);
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
      if (medalRunTrack) medalRunTrack.classList.remove('hidden');
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
    onMedalEarned(id, text) { showMedalSlide(text, false); },
    onMedalFailed(id) {
      if (id === 'noHit') showMedalSlide('✦ Untouched — FAILED', true);
    },
    onMedalHudUpdate(state) { updateMedalRunTrack(state); },
    onLootPickup(kind, label) {
      showMedalSlide(kind === 'card' ? `CARD: ${label}` : `PART: ${label}`, false);
    },
    onNiceFeedback(text) { showNiceFeedback(text); },
    onAbilityUsed() {
      if (game) updateAbilityBar(game.runCharges);
    },
    onHudUpdate(state) {
      hud.score.textContent = formatSkyScore(state.score);
      if (state.score > lastScore) {
        hud.scoreChip.classList.remove('pop');
        void hud.scoreChip.offsetWidth;
        hud.scoreChip.classList.add('pop');
      }
      lastScore = state.score;
      hud.stars.textContent = state.runStars.toLocaleString();
      if (chipHostages && hud.hostages) {
        const showH = state.mode === 'stage' && state.hostagesTotal > 0;
        chipHostages.classList.toggle('hidden', !showH);
        if (showH) {
          hud.hostages.textContent = String(state.hostagesRescued || 0).padStart(3, '0');
        }
      }
      hud.wave.textContent = state.wave;
      if (hud.waveLabel) hud.waveLabel.textContent = state.mode === 'stage' ? 'Section' : 'Wave';
      updateLives(state.lives, state.maxLives || 3);
      updateShieldBar(state.shieldPct);
      updateWeaponLevel(state.weaponLevel);
      updateCombo(state);
      updateSpeedBadge(state.timeScale);
      updateAbilityBar(state.runCharges);
      if (state.medalHud) updateMedalRunTrack(state.medalHud);
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
      const lootLines = [];
      if (state.mode === 'stage' && state.runStars > 0) {
        lootLines.push(`${state.runStars.toLocaleString()} run ★ lost — clear the stage to bank stars`);
      } else if (state.mode === 'arcade' && state.runStars > 0) {
        lootLines.push(`${state.runStars.toLocaleString()} run ★ (arcade — not added to bank)`);
      }
      if (failLostLoot) {
        const lost = state.lostUnconfirmed || {};
        const n = (lost.cards?.length || 0) + (lost.parts?.length || 0);
        if (n > 0) {
          lootLines.push(`Unconfirmed loot lost: ${lost.cards?.length || 0} card(s), ${lost.parts?.length || 0} part(s)`);
        }
        if (lootLines.length) {
          failLostLoot.textContent = lootLines.join(' · ');
          failLostLoot.classList.remove('hidden');
        } else failLostLoot.classList.add('hidden');
      }
      overlayGameOver.classList.remove('hidden');
      abilityBar.classList.add('hidden');
      if (medalRunTrack) medalRunTrack.classList.add('hidden');
    },
    onStageComplete(result) {
      const cfg = HANGAR_CONFIG;
      const starMult = cfg.difficulty.starMult[result.difficulty] || 1;
      let medalBonus = result.medals.length * cfg.stagePayout.medalBonus;
      if (result.medals.includes('noHit')) {
        medalBonus += CollectionSystem.aggregatePassiveEffects(SkyForceSave.load()).noHitStarBonus;
      }
      const rescueBonus = (result.rescued || 0) * cfg.stagePayout.rescueBonus;
      const passives = CollectionSystem.aggregatePassiveEffects(SkyForceSave.load());
      const toBank = Math.round(result.runStars * starMult * passives.starBankMult) + medalBonus + rescueBonus;
      const banked = SkyForceSave.completeStageRun({
        toBank,
        stageId: result.stageId,
        score: result.score,
        difficulty: result.difficulty,
        medals: result.medals,
      });

      if (hud.clearStageName) hud.clearStageName.textContent = result.stageName;
      if (hud.clearScore) hud.clearScore.textContent = result.score.toLocaleString();
      if (hud.clearRunStars) hud.clearRunStars.textContent = `${toBank.toLocaleString()} (${result.runStars} base)`;
      if (hud.clearBankedStars) hud.clearBankedStars.textContent = banked.toLocaleString();
      renderClearMedals(result.medals);
      if (clearNewLoot) {
        const nc = result.newCards?.length || 0;
        const np = result.newParts?.length || 0;
        if (nc + np > 0) {
          clearNewLoot.textContent = np > 0
            ? `Collection: +${nc} card(s), +${np} bonus item(s) claimed!`
            : `Collection: +${nc} card(s) claimed!`;
          clearNewLoot.classList.remove('hidden');
        } else {
          clearNewLoot.textContent = 'No cards this run — destroy elite tanks & supply crates for CARD drops.';
          clearNewLoot.classList.remove('hidden');
        }
      }
      overlayStageClear.classList.remove('hidden');
      abilityBar.classList.add('hidden');
      if (medalRunTrack) medalRunTrack.classList.add('hidden');
      if (btnClearNext) {
        const nextStage = getStageById(result.stageId + 1);
        const showNext = nextStage && SkyForceSave.isStageUnlocked(nextStage.id);
        btnClearNext.classList.toggle('hidden', !showNext);
        if (showNext) {
          btnClearNext.textContent = `NEXT — ${nextStage.name.toUpperCase()}`;
        }
      }
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
  save.runUnconfirmed = { cards: [], parts: [] };
  SkyForceSave.write(save);
  const hangarStats = CollectionSystem.mergeHangarWithCollection(
    HangarSystem.statsFromSave(save),
    save,
  );

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
  showHangarTab('upgrades');
});
tabUpgrades?.addEventListener('click', () => showHangarTab('upgrades'));
tabFleet?.addEventListener('click', () => showHangarTab('fleet'));
tabAlbum?.addEventListener('click', () => showHangarTab('album'));

btnStages.addEventListener('click', () => {
  hideAllOverlays();
  overlayStageMap.classList.remove('hidden');
  renderStageMap();
});

btnArcade.addEventListener('click', () => startGame('arcade'));
btnHangarBack.addEventListener('click', showMenu);
btnStagesBack.addEventListener('click', showMenu);

btnRetry.addEventListener('click', () => {
  if (currentMode === 'stage' && currentStageId) {
    const stage = getStageById(currentStageId);
    if (stage) startGame('stage', stage, currentStageId, currentDifficulty);
    else startGame('arcade');
  } else startGame('arcade');
});

btnClearRetry.addEventListener('click', () => {
  const stage = getStageById(currentStageId || 1);
  if (stage) startGame('stage', stage, stage.id, currentDifficulty);
});

btnClearNext?.addEventListener('click', () => {
  const stage = getStageById((currentStageId || 1) + 1);
  if (stage) startGame('stage', stage, stage.id, currentDifficulty);
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
      stageId: game.stageData?.id ?? null,
      stageName: game.stageData?.name ?? null,
      section: game.wave,
      sectionsReached: game.sectionsReached,
      lastBanner: game.lastBannerText || null,
      outcome: game.agentOutcome,
      deathCause: game.agentDeathCause,
      runHits: game.runHits,
      hostagesRescued: game.hostages.rescuedCount,
      hostagesTotal: game.hostages.totalSpawned,
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
      canvasW: game.canvas.width,
      canvasH: game.canvas.height,
      flightLane: (() => {
        const lane = Player.laneFor(game.canvas.height);
        return {
          top: Math.round(lane.top),
          bottom: Math.round(lane.bottom),
          center: Math.round(lane.center),
        };
      })(),
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
  startStage: (stageId = 1, diff = 'normal') => {
    const stage = getStageById(stageId);
    if (stage) startGame('stage', stage, stage.id, diff);
  },
  startStage1: (diff = 'normal') => startGame('stage', getStageById(1), 1, diff),
  startStage2: (diff = 'normal') => startGame('stage', getStageById(2), 2, diff),
  startStage3: (diff = 'normal') => startGame('stage', getStageById(3), 3, diff),
  startStage4: (diff = 'normal') => startGame('stage', getStageById(4), 4, diff),
  startStage5: (diff = 'normal') => startGame('stage', getStageById(5), 5, diff),
};
