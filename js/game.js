class Game {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
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

    this.bullets.update(dt, this.canvas.width, this.canvas.height);
    this.enemies.update(dt, this.wave, this.scrollSpeed * 0.35);
    this.enemies.tryFire(this.bullets, this.player, dt);
    this.powerups.update(dt, this.scrollSpeed * 0.5);
    this.stars.update(dt, this.scrollSpeed * 0.5);

    this._resolveCollisions();

    if (this.enemyKillsThisWave >= this.killsForNextWave) {
      this.wave += 1;
      this.enemyKillsThisWave = 0;
      this.killsForNextWave = Math.min(30, this.killsForNextWave + 4);
      this.scrollSpeed += 4;
    }

    this.callbacks.onHudUpdate?.({
      score: this.score,
      runStars: this.runStars,
      wave: this.wave,
      lives: this.lives,
      shieldPct: this.player.shieldPct * 100,
      weaponLevel: this.player.weaponLevel,
      combo: this.combo,
      timeScale: this.timeScale,
      bossActive: this.bossActive,
      bossHpPct: this.bossHpPct,
    });
  }

  _addScore(basePoints) {
    this.combo = Math.min(10, this.combo + 0.15);
    this.comboTimer = this.comboDecaySec;
    const points = Math.round(basePoints * this.combo);
    this.score += points;
    return points;
  }

  _resolveCollisions() {
    for (const bullet of [...this.bullets.playerBullets]) {
      for (const enemy of this.enemies.list) {
        if (!enemy.alive || !bullet.active) continue;
        if (this._hit(bullet, enemy)) {
          this.bullets.playerPool.release(bullet);
          if (enemy.takeDamage(bullet.damage)) {
            this._addScore(enemy.points);
            this.enemyKillsThisWave += 1;
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
        if (this.player.takeDamage(eb.damage)) {
          this._onPlayerDeath();
        }
      }
    }

    for (const enemy of this.enemies.list) {
      if (!enemy.alive) continue;
      if (this._hit(enemy, this.player, 0.85, true)) {
        if (this.player.takeDamage(25)) {
          this._onPlayerDeath();
        }
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
        this.runStars += 1;
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
      this.callbacks.onGameOver?.({ score: this.score, wave: this.wave, runStars: this.runStars });
    }
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.background.draw(ctx);
    this.stars.draw(ctx);
    this.powerups.draw(ctx);
    this.enemies.draw(ctx);
    this.bullets.draw(ctx);
    this.player.draw(ctx);
  }
}
