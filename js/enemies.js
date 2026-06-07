const TYPES = {
  scout: { hp: 12, radius: 12, speed: 90, points: 100, color: '#f97316', dropChance: 0.12, dropType: 'weapon', fireRate: 0 },
  fighter: { hp: 28, radius: 16, speed: 70, points: 250, color: '#a855f7', dropChance: 0.18, dropType: 'shield', fireRate: 1.8 },
  tank: { hp: 55, radius: 22, speed: 45, points: 500, color: '#ef4444', dropChance: 0.25, dropType: 'weapon', fireRate: 2.4 },
};

function makeEnemy(typeKey, x, y, wave) {
  const t = TYPES[typeKey];
  return {
    type: typeKey,
    x,
    y,
    hp: t.hp + wave * 4,
    maxHp: t.hp + wave * 4,
    radius: t.radius,
    speed: t.speed + wave * 3,
    points: t.points,
    color: t.color,
    dropChance: t.dropChance,
    dropType: t.dropType,
    fireRate: t.fireRate,
    fireTimer: Math.random() * 2,
    sway: Math.random() * Math.PI * 2,
    alive: true,
    takeDamage(amount) {
      this.hp -= amount;
      if (this.hp <= 0) {
        this.alive = false;
        return true;
      }
      return false;
    },
  };
}

class EnemyManager {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.list = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.2;
  }

  update(dt, wave, drift) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawnWave(wave);
      this.spawnTimer = Math.max(0.45, this.spawnInterval - wave * 0.05);
    }

    for (const e of this.list) {
      if (!e.alive) continue;
      e.y += e.speed * dt + drift * dt;
      e.x += Math.sin(e.sway + e.y * 0.02) * 30 * dt;
      e.fireTimer -= dt;
    }

    this.list = this.list.filter((e) => e.alive && e.y < this.h + 40);
  }

  _spawnWave(wave) {
    const pattern = Math.floor(Math.random() * 3);
    if (pattern === 0) {
      const count = 3 + Math.min(wave, 5);
      const spacing = this.w / (count + 1);
      for (let i = 1; i <= count; i += 1) {
        this.list.push(makeEnemy('scout', spacing * i, -30 - i * 20, wave));
      }
    } else if (pattern === 1) {
      this.list.push(makeEnemy('fighter', this.w * 0.25, -40, wave));
      this.list.push(makeEnemy('fighter', this.w * 0.75, -40, wave));
      if (wave >= 3) this.list.push(makeEnemy('tank', this.w * 0.5, -80, wave));
    } else {
      for (let i = 0; i < 5; i += 1) {
        const x = 40 + (this.w - 80) * (i / 4);
        this.list.push(makeEnemy(i % 2 ? 'scout' : 'fighter', x, -20 - i * 35, wave));
      }
    }
  }

  tryFire(bulletPool, player, dt) {
    for (const e of this.list) {
      if (!e.alive || e.fireRate <= 0 || e.fireTimer > 0) continue;
      if (e.y < 40 || e.y > this.h * 0.65) continue;
      e.fireTimer = e.fireRate;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = Math.min(220, 180);
      bulletPool.spawnEnemyBullet(e.x, e.y + e.radius, (dx / len) * speed, (dy / len) * speed, 6);
    }
  }

  prune() {
    this.list = this.list.filter((e) => e.alive);
  }

  draw(ctx) {
    for (const e of this.list) {
      if (!e.alive) continue;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = e.color;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (e.type === 'tank') {
        const rw = e.radius;
        const rh = e.radius * 0.6;
        ctx.rect(-rw, -rh, rw * 2, rh * 1.2);
      } else {
        ctx.moveTo(0, e.radius);
        ctx.lineTo(e.radius * 0.8, -e.radius);
        ctx.lineTo(-e.radius * 0.8, -e.radius);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();

      const hpPct = e.hp / e.maxHp;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(-16, -e.radius - 10, 32, 4);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-16, -e.radius - 10, 32 * hpPct, 4);
      ctx.restore();
    }
  }
}
