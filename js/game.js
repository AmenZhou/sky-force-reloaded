class Game {
  constructor(canvas, callbacks = {}, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.mode = options.mode || 'arcade';
    this.stageData = options.stageData || null;
    this.stageDirector = null;
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
    this.timeScale = 1;
    this.idleTimer = 0;
    this.dilationDelay = 0.1;
    this.dilationScale = 0.25;
    this.bossActive = false;
    this.bossHpPct = 100;
    this.boss = null;
    this.waveBannerTimer = 0;
    this.hitFlash = 0;
    this.screenShake = 0;
    this.maxLives = 3;

    this.background = new Background(canvas.width, canvas.height);
    this.player = new Player(canvas.width / 2, canvas.height - 80);
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
      this.enemies.setSpawnPaused(true);
      this.stageDirector = new StageDirector(this.canvas.width, this.canvas.height, {
        onBanner: (text, kind) => this.callbacks.onBanner?.(text, kind),
        onSetSection: (section) => {
          this.wave = section;
          this.callbacks.onWaveStart?.(section);
        },
        onSpawnEnemy: (type, x, y, wave, opts) => {
          this.enemies.spawn(type, x, y, wave, opts);
        },
        onSpawnBoss: (ev) => this._spawnStageBoss(ev),
      });
      this.stageDirector.getWave = () => this.wave;
      this.stageDirector.loadFromObject(this.stageData);
      this.stageDirector.start();
      this.callbacks.onStageStart?.(this.stageData);
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
      this.comboTimer -= rawDt;
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

    this.player.fire(this.bullets, dt);
    this.player.tick(rawDt);

    this.bullets.update(dt, this.canvas.width, this.canvas.height);

    if (this.mode === 'stage' && this.stageDirector?.running) {
      this.stageDirector.update(dt);
    } else {
      this.enemies.update(dt, this.wave, this.scrollSpeed * 0.35);
    }

    this.enemies.tryFire(this.bullets, this.player, dt, this.wave);
    this.powerups.update(dt, this.scrollSpeed * 0.5);
    this.stars.update(dt, this.scrollSpeed * 0.5);

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
      hitFlash: this.hitFlash,
    });
  }

  _notifyHit(damage, lostLife) {
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
    this.combo = Math.min(10, this.combo + 0.15);
    this.comboTimer = this.comboDecaySec;
    const points = Math.round(basePoints * this.combo);
    this.score += points;
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
      const medals = this.stageDirector?._medalSnapshot?.() || { completion: true };
      this.running = false;
      this.callbacks.onStageComplete?.({
        score: this.score,
        runStars: this.runStars,
        stageId: this.stageData?.id,
        stageName: this.stageData?.name,
        medals,
        clearBonusStars: bonus,
      });
    }
  }

  _resolveCollisions() {
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

    for (const bullet of [...this.bullets.playerBullets]) {
      for (const enemy of this.enemies.list) {
        if (!enemy.alive || !bullet.active) continue;
        if (this._hit(bullet, enemy)) {
          this.bullets.playerPool.release(bullet);
          if (enemy.takeDamage(bullet.damage)) {
            this._addScore(enemy.points);
            if (this.mode === 'arcade') this.enemyKillsThisWave += 1;
            this.stageDirector?.onEnemyKilled();
            this.stars.spawn(enemy.x, enemy.y, 10 + Math.floor(enemy.points / 50));
            if (Math.random() < enemy.dropChance) {
              this.powerups.spawn(enemy.x, enemy.y, enemy.dropType);
            }
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
        this.runStars += Math.max(1, Math.round(star.value / 10));
        this._addScore(star.value);
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
      this.callbacks.onGameOver?.({
        score: this.score,
        wave: this.wave,
        runStars: this.runStars,
        mode: this.mode,
        stageName: this.stageData?.name,
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
    if (this.boss?.alive) this.boss.draw(ctx);
    this.bullets.draw(ctx);
    this.player.draw(ctx);
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(244, 63, 94, ${this.hitFlash * 0.35})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }
}
