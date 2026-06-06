import { Background } from './background.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { BulletPool } from './bullets.js';
import { PowerUpManager } from './powerups.js';

export class Game {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.running = false;
    this.lastTime = 0;
    this.score = 0;
    this.wave = 1;
    this.lives = 3;
    this.scrollSpeed = 40;
    this.enemyKillsThisWave = 0;
    this.killsForNextWave = 12;

    this.background = new Background(canvas.width, canvas.height);
    this.player = new Player(canvas.width / 2, canvas.height - 80);
    this.bullets = new BulletPool();
    this.enemies = new EnemyManager(canvas.width, canvas.height);
    this.powerups = new PowerUpManager();
    this.keys = new Set();
    this.pointer = { active: false, x: canvas.width / 2, y: canvas.height - 80 };

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
      Object.assign(this.pointer, toCanvas(e.clientX, e.clientY));
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.pointer.active) return;
      Object.assign(this.pointer, toCanvas(e.clientX, e.clientY));
    });
    window.addEventListener('pointerup', () => {
      this.pointer.active = false;
    });
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.background.update(dt, this.scrollSpeed);

    const firing = this.keys.has(' ') || this.pointer.active;
    const moveX = (this.keys.has('ArrowLeft') || this.keys.has('a') ? -1 : 0)
      + (this.keys.has('ArrowRight') || this.keys.has('d') ? 1 : 0);
    const moveY = (this.keys.has('ArrowUp') || this.keys.has('w') ? -1 : 0)
      + (this.keys.has('ArrowDown') || this.keys.has('s') ? 1 : 0);

    if (this.pointer.active) {
      this.player.moveToward(this.pointer.x, this.pointer.y, dt, this.canvas.width, this.canvas.height);
    } else {
      this.player.moveByAxes(moveX, moveY, dt, this.canvas.width, this.canvas.height);
    }

    if (firing) {
      this.player.fire(this.bullets, dt);
    }

    this.bullets.update(dt, this.canvas.width, this.canvas.height);
    this.enemies.update(dt, this.wave, this.scrollSpeed * 0.35);
    this.enemies.tryFire(this.bullets, this.player, dt);
    this.powerups.update(dt, this.scrollSpeed * 0.5);

    this._resolveCollisions(dt);

    if (this.enemyKillsThisWave >= this.killsForNextWave) {
      this.wave += 1;
      this.enemyKillsThisWave = 0;
      this.killsForNextWave = Math.min(30, this.killsForNextWave + 4);
      this.scrollSpeed += 4;
    }

    this.callbacks.onHudUpdate?.({
      score: this.score,
      wave: this.wave,
      lives: this.lives,
      shieldPct: this.player.shieldPct * 100,
      weaponLevel: this.player.weaponLevel,
    });
  }

  _resolveCollisions(dt) {
    for (const bullet of this.bullets.playerBullets) {
      for (const enemy of this.enemies.list) {
        if (!enemy.alive || !bullet.active) continue;
        if (this._hit(bullet, enemy)) {
          bullet.active = false;
          if (enemy.takeDamage(bullet.damage)) {
            this.score += enemy.points;
            this.enemyKillsThisWave += 1;
            if (Math.random() < enemy.dropChance) {
              this.powerups.spawn(enemy.x, enemy.y, enemy.dropType);
            }
          }
          break;
        }
      }
    }

    for (const eb of this.bullets.enemyBullets) {
      if (!eb.active) continue;
      if (this._hit(eb, this.player)) {
        eb.active = false;
        if (this.player.takeDamage(eb.damage)) {
          this._onPlayerDeath();
        }
      }
    }

    for (const enemy of this.enemies.list) {
      if (!enemy.alive) continue;
      if (this._hit(enemy, this.player, 0.7)) {
        if (this.player.takeDamage(25)) {
          this._onPlayerDeath();
        }
        enemy.alive = false;
      }
    }

    for (const pu of this.powerups.list) {
      if (!pu.active) continue;
      if (this._hit(pu, this.player, 0.8)) {
        pu.active = false;
        this.player.applyPowerUp(pu.type);
        this.score += 50;
      }
    }

    this.enemies.prune();
    this.powerups.prune();
  }

  _hit(a, b, scale = 1) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = (a.radius + b.radius) * scale;
    return dx * dx + dy * dy < r * r;
  }

  _onPlayerDeath() {
    this.lives -= 1;
    this.player.reset(this.canvas.width / 2, this.canvas.height - 80);
    if (this.lives <= 0) {
      this.running = false;
      this.callbacks.onGameOver?.({ score: this.score, wave: this.wave });
    }
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.background.draw(ctx);
    this.powerups.draw(ctx);
    this.enemies.draw(ctx);
    this.bullets.draw(ctx);
    this.player.draw(ctx);
  }
}
