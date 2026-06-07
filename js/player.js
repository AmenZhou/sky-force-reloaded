const WEAPON_COOLDOWNS = [0.12, 0.09, 0.07, 0.05];

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.hitboxRadius = 4;
    this.speed = 220;
    this.maxShield = 100;
    this.shield = 100;
    this.weaponLevel = 1;
    this.fireTimer = 0;
    this.invuln = 0;
    this.hitFlash = 0;
  }

  get shieldPct() {
    return this.shield / this.maxShield;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.shield = this.maxShield;
    this.weaponLevel = 1;
    this.invuln = 2;
    this.hitFlash = 0;
  }

  moveByAxes(ax, ay, dt, w, h) {
    this.x = Math.max(this.hitboxRadius, Math.min(w - this.hitboxRadius, this.x + ax * this.speed * dt));
    this.y = Math.max(h * 0.45, Math.min(h - this.hitboxRadius, this.y + ay * this.speed * dt));
  }

  moveByDelta(dx, dy, w, h) {
    this.x = Math.max(this.hitboxRadius, Math.min(w - this.hitboxRadius, this.x + dx));
    this.y = Math.max(h * 0.45, Math.min(h - this.hitboxRadius, this.y + dy));
  }

  fire(bulletPool, dt) {
    this.fireTimer -= dt;
    const cd = WEAPON_COOLDOWNS[Math.min(this.weaponLevel - 1, WEAPON_COOLDOWNS.length - 1)];
    if (this.fireTimer > 0) return;
    this.fireTimer = cd;

    const spread = this.weaponLevel >= 3 ? [-12, 0, 12] : this.weaponLevel >= 2 ? [-8, 8] : [0];
    for (const offset of spread) {
      bulletPool.spawnPlayerBullet(this.x + offset, this.y - 18, 520, 8 + this.weaponLevel);
    }
  }

  applyPowerUp(type) {
    if (type === 'weapon') {
      this.weaponLevel = Math.min(4, this.weaponLevel + 1);
    } else if (type === 'shield') {
      this.shield = this.maxShield;
    } else if (type === 'life') {
      this.shield = this.maxShield;
    }
  }

  takeDamage(amount) {
    if (this.invuln > 0) return false;
    this.shield -= amount;
    this.hitFlash = 0.45;
    this.invuln = 1.5;
    if (this.shield <= 0) {
      this.shield = 0;
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.04) * 0.25;
    } else if (this.invuln > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }

    if (this.hitFlash > 0) {
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 18;
    }

    const grad = ctx.createRadialGradient(0, 8, 0, 0, 8, 22);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(12, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-12, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.ellipse(0, -4, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.shield > 0) {
      const shieldHue = this.shieldPct > 0.5 ? '52, 211, 153' : this.shieldPct > 0.25 ? '251, 191, 36' : '251, 113, 133';
      ctx.strokeStyle = `rgba(${shieldHue}, ${0.35 + this.shieldPct * 0.55})`;
      ctx.lineWidth = this.hitFlash > 0 ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  tick(dt) {
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }
}
