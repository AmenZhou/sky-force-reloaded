const WEAPON_COOLDOWNS = [0.12, 0.09, 0.07, 0.05];

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.speed = 220;
    this.maxShield = 100;
    this.shield = 100;
    this.weaponLevel = 1;
    this.fireTimer = 0;
    this.invuln = 0;
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
  }

  moveByAxes(ax, ay, dt, w, h) {
    this.x = Math.max(this.radius, Math.min(w - this.radius, this.x + ax * this.speed * dt));
    this.y = Math.max(h * 0.45, Math.min(h - this.radius, this.y + ay * this.speed * dt));
  }

  moveToward(tx, ty, dt, w, h) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = Math.min(dist, this.speed * dt);
    this.x = Math.max(this.radius, Math.min(w - this.radius, this.x + (dx / dist) * step));
    this.y = Math.max(h * 0.45, Math.min(h - this.radius, this.y + (dy / dist) * step));
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
      // handled in game via callback if extended
      this.shield = this.maxShield;
    }
  }

  takeDamage(amount) {
    if (this.invuln > 0) return false;
    this.shield -= amount;
    if (this.shield <= 0) {
      this.shield = 0;
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.invuln > 0) {
      this.invuln -= 0.016;
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }

    // Engine glow
    const grad = ctx.createRadialGradient(0, 8, 0, 0, 8, 22);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hull
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

    // Cockpit
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.ellipse(0, -4, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield ring
    if (this.shield > 0) {
      ctx.strokeStyle = `rgba(52, 211, 153, ${0.25 + this.shieldPct * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
