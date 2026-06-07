/**
 * Wave boss — spawns every 5 waves in arcade mode.
 * Two phases: aimed fan → faster spiral burst.
 */
class WaveBoss {
  constructor(x, y, wave, w) {
    this.name = 'DEBRIS CORE';
    this.x = x;
    this.y = y;
    this.w = w;
    this.wave = wave;
    this.radius = 36;
    this.maxHp = 520 + wave * 90;
    this.hp = this.maxHp;
    this.alive = true;
    this.isBoss = true;
    this.phase = 1;
    this.fireTimer = 1.2;
    this.swayT = 0;
    this.points = 2500;
  }

  get hpPct() {
    return (this.hp / this.maxHp) * 100;
  }

  update(dt, bulletPool, player, wave) {
    if (!this.alive) return;
    this.swayT += dt;
    this.x = this.w / 2 + Math.sin(this.swayT * 0.9) * (this.w * 0.28);
    this.y = 95 + Math.sin(this.swayT * 0.5) * 12;

    if (this.hp / this.maxHp <= 0.5 && this.phase === 1) {
      this.phase = 2;
      this.fireTimer = 0.3;
    }

    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;

    const interval = this.phase === 1 ? 1.1 : 0.55;
    this.fireTimer = interval;
    const damage = 7 + Math.max(0, wave - 2);
    const speed = Math.min(210, 165 + wave * 2);

    if (this.phase === 1) {
      const count = 5;
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI / 2 + ((i / (count - 1)) - 0.5) * 0.9;
        bulletPool.spawnEnemyBullet(
          this.x,
          this.y + this.radius,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          damage,
        );
      }
    } else {
      const arms = 8;
      const base = this.swayT * 2.4;
      for (let i = 0; i < arms; i += 1) {
        const angle = base + (i / arms) * Math.PI * 2;
        bulletPool.spawnEnemyBullet(
          this.x,
          this.y,
          Math.cos(angle) * speed * 0.85,
          Math.sin(angle) * speed * 0.85,
          damage,
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

    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 18;

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#fb923c';
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
