class BulletPool {
  constructor() {
    this.playerPool = new ObjectPool(() => ({
      x: 0, y: 0, vx: 0, vy: 0, radius: 4, damage: 0, active: false, color: '#fde047',
    }), 64);
    this.enemyPool = new ObjectPool(() => ({
      x: 0, y: 0, vx: 0, vy: 0, radius: 5, damage: 6, active: false, color: '#fb7185',
    }), 128);
    this.missilePool = new ObjectPool(() => ({
      x: 0, y: 0, vx: 0, vy: 0, radius: 5, damage: 0, active: false,
      color: '#a78bfa', homing: true, turnRate: 8,
    }), 24);
  }

  get missiles() {
    return this.missilePool.active;
  }

  get allPlayerProjectiles() {
    return [...this.playerPool.active, ...this.missilePool.active];
  }

  get enemyBullets() {
    return this.enemyPool.active;
  }

  get playerBullets() {
    return this.playerPool.active;
  }

  spawnPlayerBullet(x, y, speed, damage) {
    const b = this.playerPool.acquire();
    b.x = x;
    b.y = y;
    b.vx = 0;
    b.vy = speed;
    b.radius = 4;
    b.damage = damage;
    b.color = '#ff9f43';
    return b;
  }

  spawnEnemyBullet(x, y, vx, vy, damage = 6) {
    const b = this.enemyPool.acquire();
    b.x = x;
    b.y = y;
    b.vx = vx;
    b.vy = vy;
    b.radius = 5;
    b.damage = damage;
    b.color = '#fb7185';
    return b;
  }

  fireHomingMissiles(player, enemies, count, damage) {
    const targets = enemies.filter((e) => e.alive).slice(0, count);
    for (let i = 0; i < count; i += 1) {
      const m = this.missilePool.acquire();
      m.x = player.x + (i - (count - 1) / 2) * 12;
      m.y = player.y + 10;
      m.vx = 0;
      m.vy = 280;
      m.damage = damage;
      m.active = true;
      m.target = targets[i % Math.max(1, targets.length)] || null;
    }
  }

  update(dt, w, h, enemies = []) {
    this.playerPool.forEachActive((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > h + 20 || b.x < -20 || b.x > w + 20) {
        this.playerPool.release(b);
      }
    });

    this.missilePool.forEachActive((m) => {
      if (m.homing && m.target?.alive) {
        const dx = m.target.x - m.x;
        const dy = m.target.y - m.y;
        const len = Math.hypot(dx, dy) || 1;
        const desiredVx = (dx / len) * 320;
        const desiredVy = (dy / len) * 320;
        m.vx += (desiredVx - m.vx) * m.turnRate * dt;
        m.vy += (desiredVy - m.vy) * m.turnRate * dt;
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y < -30 || m.y > h + 30 || m.x < -30 || m.x > w + 30) {
        this.missilePool.release(m);
      }
    });

    this.enemyPool.forEachActive((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > h + 20 || b.x < -20 || b.x > w + 20) {
        this.enemyPool.release(b);
      }
    });
  }

  draw(ctx) {
    this.playerPool.forEachActive((b) => {
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 237, 213, 0.6)';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 4, b.radius * 0.6, b.radius * 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    this.missilePool.forEachActive((m) => {
      ctx.fillStyle = m.color;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y + 6);
      ctx.lineTo(m.x - 4, m.y - 4);
      ctx.lineTo(m.x + 4, m.y - 4);
      ctx.closePath();
      ctx.fill();
    });
    this.enemyPool.forEachActive((b) => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.color;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
  }

  clear() {
    this.playerPool.releaseAll();
    this.missilePool.releaseAll();
    this.enemyPool.releaseAll();
  }
}
