export class BulletPool {
  constructor() {
    this.playerBullets = [];
    this.enemyBullets = [];
  }

  spawnPlayerBullet(x, y, speed, damage) {
    this.playerBullets.push({
      x, y, vx: 0, vy: -speed, radius: 4, damage, active: true, color: '#fde047',
    });
  }

  spawnEnemyBullet(x, y, vx, vy, damage = 6) {
    this.enemyBullets.push({
      x, y, vx, vy, radius: 5, damage, active: true, color: '#fb7185',
    });
  }

  update(dt, w, h) {
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -20 || b.x < -20 || b.x > w + 20) b.active = false;
    }
    for (const b of this.enemyBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > h + 20 || b.x < -20 || b.x > w + 20) b.active = false;
    }
    this.playerBullets = this.playerBullets.filter((b) => b.active);
    this.enemyBullets = this.enemyBullets.filter((b) => b.active);
  }

  draw(ctx) {
    for (const b of this.playerBullets) {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of this.enemyBullets) {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}
