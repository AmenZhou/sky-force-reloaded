class BulletPool {
  constructor() {
    this.playerPool = new ObjectPool(() => ({
      x: 0, y: 0, vx: 0, vy: 0, radius: 4, damage: 0, active: false, color: '#fde047',
    }), 64);
    this.enemyPool = new ObjectPool(() => ({
      x: 0, y: 0, vx: 0, vy: 0, radius: 5, damage: 6, active: false, color: '#fb7185',
    }), 128);
  }

  get playerBullets() {
    return this.playerPool.active;
  }

  get enemyBullets() {
    return this.enemyPool.active;
  }

  spawnPlayerBullet(x, y, speed, damage) {
    const b = this.playerPool.acquire();
    b.x = x;
    b.y = y;
    b.vx = 0;
    b.vy = -speed;
    b.radius = 4;
    b.damage = damage;
    b.color = '#fde047';
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

  update(dt, w, h) {
    this.playerPool.forEachActive((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -20 || b.x < -20 || b.x > w + 20) {
        this.playerPool.release(b);
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
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    this.enemyPool.forEachActive((b) => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  clear() {
    this.playerPool.releaseAll();
    this.enemyPool.releaseAll();
  }
}
