/**
 * Wave / stage boss — two phases: aimed fan → faster spiral burst.
 * Tuned for ~12–15s TTK at weapon Lv 3 (human pace); Lv 4 clears faster.
 */
class WaveBoss {
  constructor(x, y, wave, w, options = {}) {
    this.name = options.name || 'DEBRIS CORE';
    this.x = x;
    this.y = y;
    this.w = w;
    this.wave = wave;
    this.radius = 36;
    const defaultHp = options.stageBoss ? 4200 : 2000 + wave * 90;
    this.maxHp = options.maxHp ?? defaultHp;
    this.hp = this.maxHp;
    this.alive = true;
    this.isBoss = true;
    this.phase = 1;
    this.fireTimer = 1.4;
    this.swayT = 0;
    this.points = options.stageBoss ? 5000 : 2500;
    this.stageBoss = !!options.stageBoss;
    this.rageFlash = 0;
    this.fireScale = options.fireScale ?? 1;
  }

  get hpPct() {
    return (this.hp / this.maxHp) * 100;
  }

  update(dt, bulletPool, player, wave) {
    if (!this.alive) return;
    this.swayT += dt;
    this.x = this.w / 2 + Math.sin(this.swayT * 0.85) * (this.w * 0.26);
    this.y = 95 + Math.sin(this.swayT * 0.45) * 14;

    if (this.hp / this.maxHp <= 0.5 && this.phase === 1) {
      this.phase = 2;
      this.fireTimer = 0.65;
      this.rageFlash = 0.5;
    }

    if (this.rageFlash > 0) this.rageFlash -= dt;

    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;

    const bal = window.ENEMY_BALANCE?.boss || {};
    const p1 = bal.phase1 || { bullets: 5, interval: 1.12 };
    const p2 = bal.phase2 || { arms: 7, interval: 0.58, extraAimed: false };
    const interval = (this.phase === 1 ? p1.interval : p2.interval) / this.fireScale;
    this.fireTimer = interval;
    const damage = (7 + Math.max(0, wave - 2)) * (this.phase === 2 ? 1.15 : 1);
    const speed = Math.min(205, 150 + wave * 2 + (this.phase === 2 ? 10 : 0));

    if (this.phase === 1) {
      const count = p1.bullets ?? 5;
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI / 2 + ((i / (count - 1)) - 0.5) * 0.95;
        bulletPool.spawnEnemyBullet(
          this.x,
          this.y + this.radius,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          damage,
        );
      }
    } else {
      const arms = p2.arms ?? 7;
      const base = this.swayT * 2.8;
      for (let i = 0; i < arms; i += 1) {
        const angle = base + (i / arms) * Math.PI * 2;
        bulletPool.spawnEnemyBullet(
          this.x,
          this.y,
          Math.cos(angle) * speed * 0.88,
          Math.sin(angle) * speed * 0.88,
          damage,
        );
      }
      if (p2.extraAimed) {
        bulletPool.spawnEnemyBullet(
          this.x,
          this.y + this.radius,
          (player.x - this.x) * 0.6,
          200,
          damage + 1,
        );
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.rageFlash > 0) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 28;
    } else {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18;
    }

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = this.phase === 2 ? '#ef4444' : '#fb923c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.72;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.phase === 2 ? '#ef4444' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 8px Rajdhani, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 0, this.radius + 16);

    ctx.restore();
  }
}
