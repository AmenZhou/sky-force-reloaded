class Game {
  constructor(canvas, callbacks = {}, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.mode = options.mode || 'arcade';
    this.stageData = options.stageData || null;
    this.difficulty = options.difficulty || 'normal';
    this.hangarStats = options.hangarStats || HangarSystem.statsFromSave(SkyForceSave.load());
    this.stageDirector = null;
    this.hostages = new HostageManager();
    this.destructibles = new DestructibleManager();
    this.runLoot = new RunLootManager();
    this.fx = new FxManager();
    this.medalTracker = null;
    this.runHits = 0;
    this.runCharges = {};
    this.friendCheckpoint = options.friendCheckpoint ?? SkyForceSave.load().friendCheckpointScore ?? 42000;
    this.checkpointPassed = false;
    this.running = false;
    this.rafId = 0;
    this.lastTime = 0;
    this.score = 0;
    this.runStars = 0;
    this.wave = 1;
    this.lives = 3;
    this.scrollSpeed = 40;
    this.enemyKillsThisWave = 0;
    this.killsForNextWave = 12;
    this.combo = 1;
    this.comboTimer = 0;
    this.comboDecaySec = 3;
    this.arcadeCrateTimer = 8;
    this.timeScale = 1;
    this.idleTimer = 0;
    this.dilationDelay = 0.1;
    this.dilationScale = 0.2;
    this.bossActive = false;
    this.bossHpPct = 100;
    this.boss = null;
    this.waveBannerTimer = 0;
    this.hitFlash = 0;
    this.screenShake = 0;
    this.maxLives = 3;

    this.background = new Background(canvas.width, canvas.height);
    this.player = new Player(canvas.width / 2, canvas.height - 80);
    this.player.applyHangar(this.hangarStats);
    this.runCharges = {
      laser: this.hangarStats.laserCharges,
      shield: this.hangarStats.shieldCharges,
      bomb: this.hangarStats.bombCharges,
    };
    this.bullets = new BulletPool();
    this.enemies = new EnemyManager(canvas.width, canvas.height);
    this.powerups = new PowerUpManager();
    this.stars = new StarManager();
    this.keys = new Set();
    this.pointer = {
      active: false,
      lastX: canvas.width / 2,
      lastY: canvas.height - 80,
    };
    this.pointerEverUsed = false;

    this._bindInput();
  }

  _bindInput() {
    const onKey = (down) => (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (down) this.keys.add(e.key);
      else this.keys.delete(e.key);
      if (down && e.key === 'z') this.useAbility('laser');
      if (down && e.key === 'x') this.useAbility('shield');
      if (down && e.key === 'c') this.useAbility('bomb');
    };
    window.addEventListener('keydown', onKey(true));
    window.addEventListener('keyup', onKey(false));

    const toCanvas = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * this.canvas.width,
        y: ((clientY - rect.top) / rect.height) * this.canvas.height,
      };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointer.active = true;
      this.pointerEverUsed = true;
      const p = toCanvas(e.clientX, e.clientY);
      this.pointer.lastX = p.x;
      this.pointer.lastY = p.y;
      this.idleTimer = 0;
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.pointer.active) return;
      const p = toCanvas(e.clientX, e.clientY);
      const dx = p.x - this.pointer.lastX;
      const dy = p.y - this.pointer.lastY;
      this.pointer.lastX = p.x;
      this.pointer.lastY = p.y;
      this.player.moveByDelta(dx, dy, this.canvas.width, this.canvas.height);
      this.idleTimer = 0;
    });
    const endPointer = () => {
      this.pointer.active = false;
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
  }

  _movementKeysHeld() {
    return this.keys.has('ArrowLeft') || this.keys.has('a')
      || this.keys.has('ArrowRight') || this.keys.has('d')
      || this.keys.has('ArrowUp') || this.keys.has('w')
      || this.keys.has('ArrowDown') || this.keys.has('s');
  }

  _updateTimeScale(dt) {
    if (!this.pointerEverUsed) {
      this.timeScale = 1;
      this.idleTimer = 0;
      return;
    }
    if (this.pointer.active || this._movementKeysHeld()) {
      this.idleTimer = 0;
      this.timeScale = 1;
      return;
    }
    this.idleTimer += dt;
    this.timeScale = this.idleTimer >= this.dilationDelay ? this.dilationScale : 1;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();

    if (this.mode === 'stage' && this.stageData) {
      this.background.setTheme('terrain');
      this.enemies.setSpawnPaused(true);
      this.stageDirector = new StageDirector(this.canvas.width, this.canvas.height, {
        onBanner: (text, kind) => this.callbacks.onBanner?.(text, kind),
        onSetSection: (section) => {
          this.wave = section;
          this.callbacks.onWaveStart?.(section);
        },
        onSpawnEnemy: (type, x, y, wave, opts) => {
          const hpMult = (window.HANGAR_CONFIG?.difficulty?.enemyHp?.[this.difficulty] || 1)
            * (opts?.hpMult || 1);
          this.enemies.spawn(type, x, y, wave, { ...opts, difficultyHpMult: hpMult });
        },
        onSpawnHostage: (id, x, y) => this.hostages.spawn(id, x, y),
        onSpawnDestructible: (type, x, y) => this.destructibles.spawn(type, x, y),
        onSpawnBoss: (ev) => this._spawnStageBoss(ev),
      });
      this.stageDirector.getWave = () => this.wave;
      this.stageDirector.loadFromObject(this.stageData);
      this.stageDirector.start();
      this.medalTracker = new MedalRunTracker(HANGAR_CONFIG.medals, {
        onMedalEarned: (id, text) => this.callbacks.onMedalEarned?.(id, text),
        onMedalFailed: (id) => this.callbacks.onMedalFailed?.(id),
      });
      this.medalTracker.reset(2);
      this.callbacks.onMedalHudUpdate?.(this.medalTracker.hudState());
      this.callbacks.onStageStart?.(this.stageData);
    } else {
      this.background.setTheme('space');
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  loop(now) {
    if (!this.running) return;
    const rawDt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(rawDt);
    this.draw();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  update(rawDt) {
    this._updateTimeScale(rawDt);
    const dt = rawDt * this.timeScale;

    if (this.comboTimer > 0) {
      this.comboTimer -= rawDt / (this.hangarStats.comboDecayMult || 1);
      if (this.comboTimer <= 0) this.combo = 1;
    }

    this.background.update(dt, this.scrollSpeed);

    if (this._movementKeysHeld()) {
      const moveX = (this.keys.has('ArrowLeft') || this.keys.has('a') ? -1 : 0)
        + (this.keys.has('ArrowRight') || this.keys.has('d') ? 1 : 0);
      const moveY = (this.keys.has('ArrowUp') || this.keys.has('w') ? -1 : 0)
        + (this.keys.has('ArrowDown') || this.keys.has('s') ? 1 : 0);
      this.player.moveByAxes(moveX, moveY, dt, this.canvas.width, this.canvas.height);
    }

    this.player.fire(this.bullets, dt, this.enemies.list);
    this.player.tick(rawDt);
    this._applyLaserBeam(dt);

    this.bullets.update(dt, this.canvas.width, this.canvas.height, this.enemies.list);

    if (this.mode === 'stage' && this.stageDirector?.running) {
      this.stageDirector.update(dt);
    } else {
      this.enemies.update(dt, this.wave, this.scrollSpeed * 0.35);
    }

    const bulletMult = window.HANGAR_CONFIG?.difficulty?.bulletSpeed?.[this.difficulty] || 1;
    this.enemies.tryFire(this.bullets, this.player, dt, this.wave, bulletMult);
    this.powerups.update(dt, this.scrollSpeed * 0.5);
    this.destructibles.update(dt, this.scrollSpeed * 0.35);
    this.runLoot.update(
      dt,
      this.scrollSpeed * 0.5,
      this.player,
      this.hangarStats.magnetRadius,
      this.hangarStats.magnetStrength,
    );
    this.stars.update(
      dt,
      this.scrollSpeed * 0.5,
      this.player,
      this.hangarStats.magnetRadius,
      this.hangarStats.magnetStrength,
    );
    this.fx.update(dt);
    this.hostages.update(dt, this.player, (h) => {
      const bonus = 5 * (this.hangarStats.starPickupMult || 1);
      this.runStars += Math.round(bonus);
      this._addScore(200 + (this.hangarStats.rescueScoreBonus || 0));
      this.callbacks.onHostageRescued?.(h.id);
      if (this.medalTracker) {
        this.medalTracker.onHostageRescued(
          this.hostages.totalSpawned,
          this.hostages.rescuedCount,
        );
        this.callbacks.onMedalHudUpdate?.(this.medalTracker.hudState());
      }
    });

    if (this.mode === 'arcade' && !this.bossActive) {
      this.arcadeCrateTimer -= rawDt;
      if (this.arcadeCrateTimer <= 0) {
        this.arcadeCrateTimer = 10 + Math.random() * 8;
        this.destructibles.spawn('crate', 40 + Math.random() * (this.canvas.width - 80), -20);
        if (this.wave >= 3 && Math.random() < 0.35) {
          this.destructibles.spawn('radar', 60 + Math.random() * (this.canvas.width - 120), -40);
        }
      }
    }

    if (this.mode === 'stage' && this.stageDirector && this.medalTracker) {
      const ks = this.stageDirector.killStats;
      this.medalTracker.onKillStats(ks.spawned, ks.killed);
      this.callbacks.onMedalHudUpdate?.(this.medalTracker.hudState());
    }

    if (this.mode === 'stage' && !this.checkpointPassed && this.score >= this.friendCheckpoint) {
      this.checkpointPassed = true;
      this.callbacks.onCheckpointPassed?.(this.friendCheckpoint);
    }

    this._resolveCollisions();

    if (this.mode === 'arcade' && !this.bossActive
      && this.enemyKillsThisWave >= this.killsForNextWave) {
      const prevWave = this.wave;
      this.wave += 1;
      this.enemyKillsThisWave = 0;
      this.killsForNextWave = Math.min(30, this.killsForNextWave + 4);
      this.scrollSpeed += 4;
      this.waveBannerTimer = 2.2;
      this.callbacks.onWaveStart?.(this.wave);
      if (this.wave % 5 === 0 && this.wave !== prevWave) {
        this._spawnWaveBoss();
      }
    }

    if (this.boss?.alive) {
      this.boss.update(dt, this.bullets, this.player, this.wave);
      this.bossHpPct = this.boss.hpPct;
    }

    if (this.waveBannerTimer > 0) this.waveBannerTimer -= rawDt;

    if (this.hitFlash > 0) this.hitFlash -= rawDt;
    if (this.screenShake > 0) this.screenShake -= rawDt;

    this.callbacks.onHudUpdate?.({
      score: this.score,
      runStars: this.runStars,
      wave: this.wave,
      lives: this.lives,
      maxLives: this.maxLives,
      mode: this.mode,
      stageName: this.stageData?.name || null,
      shieldPct: this.player.shieldPct * 100,
      weaponLevel: this.player.weaponLevel,
      combo: this.combo,
      timeScale: this.timeScale,
      bossActive: this.bossActive,
      bossHpPct: this.bossHpPct,
      bossName: this.boss?.name || null,
      waveBanner: this.waveBannerTimer > 0 ? this.wave : 0,
      runCharges: { ...this.runCharges },
      difficulty: this.difficulty,
      hitFlash: this.hitFlash,
      medalHud: this.medalTracker?.hudState() || null,
      runUnconfirmed: SkyForceSave.load().runUnconfirmed,
      hostagesRescued: this.hostages.rescuedCount,
      hostagesTotal: this.hostages.totalSpawned,
    });
  }

  _notifyHit(damage, lostLife) {
    this.runHits += 1;
    this.medalTracker?.onPlayerDamaged();
    this.callbacks.onMedalHudUpdate?.(this.medalTracker?.hudState() || null);
    this.hitFlash = Math.max(this.hitFlash, 0.35);
    this.screenShake = 0.2;
    this.callbacks.onPlayerHit?.({
      damage,
      shieldPct: this.player.shieldPct * 100,
      lives: this.lives,
      lostLife,
    });
  }

  _addScore(basePoints) {
    const prevCombo = this.combo;
    this.combo = Math.min(10, this.combo + 0.15);
    this.comboTimer = this.comboDecaySec;
    const points = Math.round(basePoints * this.combo);
    this.score += points;
    if (prevCombo < 2 && this.combo >= 2) {
      this.callbacks.onNiceFeedback?.('NICE');
    } else if (prevCombo < 4 && this.combo >= 4) {
      this.callbacks.onNiceFeedback?.('GREAT');
    } else if (prevCombo < 6 && this.combo >= 6) {
      this.callbacks.onNiceFeedback?.('EXCELLENT');
    }
    return points;
  }

  _spawnWaveBoss() {
    this.boss = new WaveBoss(this.canvas.width / 2, 90, this.wave, this.canvas.width, {
      stageBoss: false,
    });
    this.bossActive = true;
    this.bossHpPct = 100;
    this.enemies.setSpawnPaused(true);
    this.screenShake = 0.35;
    this.callbacks.onBossSpawn?.({ name: this.boss.name, wave: this.wave });
  }

  _spawnStageBoss(ev) {
    this.boss = new WaveBoss(this.canvas.width / 2, 90, Math.max(3, this.wave), this.canvas.width, {
      maxHp: ev.hp || 4200,
      name: ev.name || 'DEBRIS CORE',
      stageBoss: true,
      fireScale: 1.1,
    });
    this.bossActive = true;
    this.bossHpPct = 100;
    this.enemies.setSpawnPaused(true);
    this.screenShake = 0.45;
    this.callbacks.onBossSpawn?.({ name: this.boss.name, wave: this.wave, stage: true });
  }

  _onBossDefeated() {
    const x = this.boss.x;
    const y = this.boss.y;
    const wasStageBoss = this.boss.stageBoss;
    this.boss = null;
    this.bossActive = false;
    this.bossHpPct = 100;
    this.enemies.setSpawnPaused(false);
    this._addScore(wasStageBoss ? 5000 : 3500);
    this.runStars += wasStageBoss ? 40 : 25;
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      this.stars.spawn(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20, 18);
    }
    this.powerups.spawn(x, y, 'weapon');
    this.powerups.spawn(x - 30, y + 10, 'shield');
    this.waveBannerTimer = 2.5;
    this.callbacks.onBossDefeated?.({ wave: this.wave, stageBoss: wasStageBoss });

    if (wasStageBoss && this.mode === 'stage') {
      this.stageDirector?.stop();
      const bonus = this.stageData?.clearBonusStars || 50;
      this.runStars += bonus;
      const medals = this.medalTracker
        ? this.medalTracker.snapshotForClear(
          this.stageDirector.killStats.spawned,
          this.stageDirector.killStats.killed,
          { total: this.hostages.totalSpawned, rescued: this.hostages.rescuedCount },
        )
        : this._computeMedals();
      const save = SkyForceSave.load();
      const confirmed = CollectionSystem.confirmRunLoot(save);
      SkyForceSave.write(save);
      this.running = false;
      this.callbacks.onStageComplete?.({
        score: this.score,
        runStars: this.runStars,
        stageId: this.stageData?.id,
        stageName: this.stageData?.name,
        difficulty: this.difficulty,
        medals,
        clearBonusStars: bonus,
        rescued: this.hostages.rescuedCount,
        killPct: this.stageDirector?.killStats
          ? this.stageDirector.killStats.killed / Math.max(1, this.stageDirector.killStats.spawned)
          : 0,
        newCards: confirmed.newCards,
        newParts: confirmed.newParts,
      });
    }
  }

  _computeMedals() {
    const spawned = this.stageDirector?.killStats?.spawned || 0;
    const killed = this.stageDirector?.killStats?.killed || 0;
    const killPct = spawned ? killed / spawned : 0;
    const medals = [];
    if (killPct >= 0.7) medals.push('destroy70');
    if (spawned > 0 && killed >= spawned) medals.push('destroy100');
    if (this.hostages.totalSpawned > 0 && this.hostages.allRescued) medals.push('rescueAll');
    if (this.runHits === 0) medals.push('noHit');
    return medals;
  }

  _luckMult() {
    return (this.hangarStats.luckMult || 1) * (this.hangarStats.lootLuckMult || 1);
  }

  _tryLootDrop(x, y, source) {
    const luck = this._luckMult();
    const card = CollectionSystem.rollCardDrop(source, luck);
    if (card) {
      this.runLoot.spawn(x, y, 'card', card.id);
      return;
    }
    const part = CollectionSystem.rollPartDrop(luck, source === 'radar' ? 'radar' : 'elite');
    if (part) this.runLoot.spawn(x, y, 'part', part);
  }

  _collectRunLoot(item) {
    const save = SkyForceSave.load();
    let label = '';
    if (item.kind === 'card') {
      if (CollectionSystem.addUnconfirmedCard(save, item.payload)) {
        const def = CollectionSystem.getCardDef(item.payload);
        label = def?.name || 'Card';
        this.callbacks.onLootPickup?.('card', label);
      }
    } else if (item.kind === 'part') {
      if (CollectionSystem.addUnconfirmedPart(save, item.payload)) {
        const def = COLLECTION_CONFIG.partLabels[item.payload];
        label = def || 'Ship Part';
        this.callbacks.onLootPickup?.('part', label);
      }
    }
    SkyForceSave.write(save);
    item.active = false;
  }

  _onDestructibleDestroyed(d) {
    const x = d.x;
    const y = d.y;
    this.screenShake = Math.max(this.screenShake, 0.25);
    this.fx.starShower(x, y);
    this.fx.burst(x, y, { count: 18, speed: 140, color: '#fb923c', life: 0.5 });
    this._addScore(d.type === 'radar' || d.type === 'fuel' ? 400 : 120);

    if (d.dropProfile === 'crate') {
      const rates = COLLECTION_CONFIG.dropRates;
      if (Math.random() < rates.cratePowerup) {
        this.powerups.spawn(x, y, Math.random() < 0.5 ? 'weapon' : 'shield');
        if (Math.random() < 0.4) this.powerups.spawn(x + 20, y + 8, 'shield');
      }
      for (let i = 0; i < 3; i += 1) {
        this.stars.spawn(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, 14);
      }
      this._tryLootDrop(x, y, 'crate');
    } else {
      for (let i = 0; i < 18; i += 1) {
        const angle = (i / 18) * Math.PI * 2;
        this.stars.spawn(x + Math.cos(angle) * 28, y + Math.sin(angle) * 28, 24);
      }
      this._tryLootDrop(x, y, 'radar');
    }
  }

  useAbility(kind) {
    if (!this.running) return false;
    if (kind === 'laser' && this.runCharges.laser > 0) {
      this.runCharges.laser -= 1;
      this.player.activateLaser();
      this.callbacks.onAbilityUsed?.('laser', this.runCharges.laser);
      return true;
    }
    if (kind === 'shield' && this.runCharges.shield > 0) {
      this.runCharges.shield -= 1;
      this.player.activateEnergyShield();
      this.callbacks.onAbilityUsed?.('shield', this.runCharges.shield);
      return true;
    }
    if (kind === 'bomb' && this.runCharges.bomb > 0) {
      this.runCharges.bomb -= 1;
      this._triggerMegaBomb();
      this.callbacks.onAbilityUsed?.('bomb', this.runCharges.bomb);
      return true;
    }
    return false;
  }

  _triggerMegaBomb() {
    this.bullets.enemyPool.releaseAll();
    this.screenShake = 0.5;
    for (const enemy of this.enemies.list) {
      if (!enemy.alive) continue;
      if (enemy.takeDamage(Math.round(enemy.maxHp * 0.55))) {
        this._addScore(enemy.points);
        this.stageDirector?.onEnemyKilled();
        this.stars.spawn(enemy.x, enemy.y, 12);
      }
    }
    if (this.boss?.alive) {
      this.boss.takeDamage(Math.round(this.boss.maxHp * 0.2));
      this.bossHpPct = this.boss.hpPct;
    }
  }

  _applyLaserBeam(dt) {
    if (this.player.laserActive <= 0) return;
    const px = this.player.x;
    const dmg = 80 * dt;
    for (const enemy of this.enemies.list) {
      if (!enemy.alive) continue;
      if (Math.abs(enemy.x - px) < 20 && enemy.y < this.player.y) {
        if (enemy.takeDamage(dmg)) {
          this._addScore(enemy.points);
          this.stageDirector?.onEnemyKilled();
          this.stars.spawn(enemy.x, enemy.y, 10);
          this.screenShake = 0.15;
        }
      }
    }
    if (this.boss?.alive && Math.abs(this.boss.x - px) < 40) {
      this.boss.takeDamage(dmg * 1.5);
      this.bossHpPct = this.boss.hpPct;
    }
  }

  _resolveCollisions() {
    for (const bullet of [...this.bullets.playerBullets]) {
      if (!bullet.active) continue;
      for (const d of this.destructibles.list) {
        if (!d.active) continue;
        if (this._hit(bullet, d)) {
          this.bullets.playerPool.release(bullet);
          if (this.destructibles.takeDamage(d, bullet.damage)) {
            this._onDestructibleDestroyed(d);
          }
          break;
        }
      }
    }

    if (this.boss?.alive) {
      for (const bullet of [...this.bullets.playerBullets]) {
        if (!bullet.active) continue;
        if (this._hit(bullet, this.boss)) {
          this.bullets.playerPool.release(bullet);
          if (this.boss.takeDamage(bullet.damage)) {
            this._addScore(this.boss.points);
            this.enemyKillsThisWave += 1;
            this._onBossDefeated();
          }
          break;
        }
      }

      if (this.boss?.alive && this._hit(this.boss, this.player, 0.85, true)) {
        const lostLife = this.player.takeDamage(22);
        this._notifyHit(22, lostLife);
        if (lostLife) this._onPlayerDeath();
      }
    }

    for (const bullet of [...this.bullets.playerBullets, ...this.bullets.missiles]) {
      for (const enemy of this.enemies.list) {
        if (!enemy.alive || !bullet.active) continue;
        if (this._hit(bullet, enemy)) {
          if (bullet.homing) this.bullets.missilePool.release(bullet);
          else this.bullets.playerPool.release(bullet);
          if (enemy.takeDamage(bullet.damage)) {
            this._addScore(enemy.points);
            this.fx.hitSpark(enemy.x, enemy.y);
            if (enemy.type === 'tank' || enemy.elite) {
              this.fx.burst(enemy.x, enemy.y, { count: 14, speed: 130, color: '#f97316', life: 0.4 });
            }
            if (this.mode === 'arcade') this.enemyKillsThisWave += 1;
            this.stageDirector?.onEnemyKilled();
            const starVal = 12 + Math.floor(enemy.points / 40);
            for (let s = 0; s < (enemy.elite ? 4 : 2); s += 1) {
              this.stars.spawn(
                enemy.x + (Math.random() - 0.5) * 24,
                enemy.y + (Math.random() - 0.5) * 16,
                starVal,
              );
            }
            this.screenShake = 0.12;
            if (enemy.elite) this._tryLootDrop(enemy.x, enemy.y, 'elite');
            if (Math.random() < enemy.dropChance) {
              this.powerups.spawn(enemy.x, enemy.y, enemy.dropType);
            }
          }
          break;
        }
      }
    }

    if (this.boss?.alive) {
      for (const bullet of [...this.bullets.missiles]) {
        if (!bullet.active) continue;
        if (this._hit(bullet, this.boss)) {
          this.bullets.missilePool.release(bullet);
          if (this.boss.takeDamage(bullet.damage)) {
            this._addScore(this.boss.points);
            this._onBossDefeated();
          }
          break;
        }
      }
    }

    for (const eb of [...this.bullets.enemyBullets]) {
      if (!eb.active) continue;
      if (this._hit(eb, this.player, 1, true)) {
        this.bullets.enemyPool.release(eb);
        const lostLife = this.player.takeDamage(eb.damage);
        this._notifyHit(eb.damage, lostLife);
        if (lostLife) this._onPlayerDeath();
      }
    }

    for (const enemy of this.enemies.list) {
      if (!enemy.alive) continue;
      if (this._hit(enemy, this.player, 0.85, true)) {
        const lostLife = this.player.takeDamage(18);
        this._notifyHit(18, lostLife);
        if (lostLife) this._onPlayerDeath();
        enemy.alive = false;
      }
    }

    for (const pu of this.powerups.list) {
      if (!pu.active) continue;
      if (this._hit(pu, this.player, 1.2, true)) {
        pu.active = false;
        this.player.applyPowerUp(pu.type);
        this._addScore(50);
      }
    }

    for (const star of this.stars.list) {
      if (!star.active) continue;
      if (this._hit(star, this.player, 1.4, true)) {
        star.active = false;
        const starMult = this.hangarStats.starPickupMult || 1;
        this.runStars += Math.max(1, Math.round((star.value / 10) * starMult));
        this._addScore(star.value);
      }
    }

    for (const item of this.runLoot.list) {
      if (!item.active) continue;
      if (this._hit(item, this.player, 1.3, true)) {
        this._collectRunLoot(item);
      }
    }

    this.enemies.prune();
    this.powerups.prune();
    this.stars.prune();
  }

  _hit(a, b, scale = 1, usePlayerHitbox = false) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const bRadius = usePlayerHitbox && b.hitboxRadius != null ? b.hitboxRadius : b.radius;
    const aRadius = usePlayerHitbox && a.hitboxRadius != null ? a.hitboxRadius : a.radius;
    const r = (aRadius + bRadius) * scale;
    return dx * dx + dy * dy < r * r;
  }

  _onPlayerDeath() {
    this.lives -= 1;
    this.combo = 1;
    this.comboTimer = 0;
    this.player.reset(this.canvas.width / 2, this.canvas.height - 80);
    if (this.lives <= 0) {
      this.running = false;
      this.stageDirector?.stop();
      const save = SkyForceSave.load();
      const lost = { ...(save.runUnconfirmed || {}) };
      CollectionSystem.discardRunLoot(save);
      SkyForceSave.write(save);
      this.callbacks.onGameOver?.({
        score: this.score,
        wave: this.wave,
        runStars: this.runStars,
        mode: this.mode,
        stageName: this.stageData?.name,
        lostUnconfirmed: lost,
      });
    }
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.save();
    if (this.screenShake > 0) {
      const s = this.screenShake * 6;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.background.draw(ctx);
    this.stars.draw(ctx);
    this.powerups.draw(ctx);
    this.enemies.draw(ctx);
    this.destructibles.draw(ctx);
    this.hostages.draw(ctx);
    if (this.boss?.alive) this.boss.draw(ctx);
    this.bullets.draw(ctx);
    this.fx.draw(ctx);
    this.runLoot.draw(ctx);
    this.player.draw(ctx);
    if (this.mode === 'stage') this._drawCheckpointMarker(ctx);
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(244, 63, 94, ${this.hitFlash * 0.35})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }

  _drawCheckpointMarker(ctx) {
    const { canvas } = this;
    const y = canvas.height * 0.38;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = this.checkpointPassed ? 'rgba(74, 222, 128, 0.6)' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(canvas.width - 52, y - 18, 44, 36);
    ctx.strokeRect(canvas.width - 52, y - 18, 44, 36);
    ctx.fillStyle = this.checkpointPassed ? '#4ade80' : '#94a3b8';
    ctx.font = 'bold 7px Rajdhani,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FRIEND', canvas.width - 30, y - 4);
    ctx.fillText(String(Math.round(this.friendCheckpoint / 1000)) + 'k', canvas.width - 30, y + 8);
    ctx.restore();
  }
}
