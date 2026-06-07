const WEAPON_COOLDOWNS = [0.12, 0.09, 0.07, 0.05];

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.hitboxRadius = 4;
    this.speed = 220;
    this.moveSpeedMult = 1;
    this.damageMult = 1;
    this.missileSwarm = false;
    this.maxShield = 100;
    this.shield = 100;
    this.weaponLevel = 1;
    this.fireTimer = 0;
    this.missileTimer = 0;
    this.invuln = 0;
    this.hitFlash = 0;
    this.hangarStats = null;
    this.energyShieldActive = 0;
    this.laserActive = 0;
  }

  get shieldPct() {
    return this.shield / this.maxShield;
  }

  applyHangar(stats) {
    this.hangarStats = stats;
    this.maxShield = stats.shieldMax;
    this.shield = stats.startShieldFull ? stats.shieldMax : stats.shieldMax;
    this.moveSpeedMult = stats.moveSpeedMult || 1;
    this.damageMult = stats.damageMult || 1;
    this.missileSwarm = !!stats.missileSwarm;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    const max = this.hangarStats?.shieldMax || 100;
    this.maxShield = max;
    this.shield = max;
    this.weaponLevel = 1;
    this.invuln = 2;
    this.hitFlash = 0;
    this.energyShieldActive = 0;
    this.laserActive = 0;
  }

  moveByAxes(ax, ay, dt, w, h) {
    const spd = this.speed * (this.moveSpeedMult || 1);
    this.x = Math.max(this.hitboxRadius, Math.min(w - this.hitboxRadius, this.x + ax * spd * dt));
    this.y = Math.max(h * 0.45, Math.min(h - this.hitboxRadius, this.y + ay * spd * dt));
  }

  moveByDelta(dx, dy, w, h) {
    this.x = Math.max(this.hitboxRadius, Math.min(w - this.hitboxRadius, this.x + dx));
    this.y = Math.max(h * 0.45, Math.min(h - this.hitboxRadius, this.y + dy));
  }

  _cannonPattern() {
    const hangar = this.hangarStats?.cannonPattern || 1;
    const pickup = this.weaponLevel;
    const tier = Math.max(hangar, Math.min(4, pickup));
    if (tier >= 4) return [-16, -8, 0, 8, 16];
    if (tier >= 3) return [-12, 0, 12];
    if (tier >= 2) return [-8, 8];
    return [0];
  }

  fire(bulletPool, dt, enemies = []) {
    if (this.laserActive > 0) return;

    this.fireTimer -= dt;
    const hs = this.hangarStats;
    const patternTier = Math.min(4, Math.max(this.weaponLevel, hs?.cannonPattern || 1));
    const cdBase = WEAPON_COOLDOWNS[Math.min(patternTier - 1, WEAPON_COOLDOWNS.length - 1)];
    const cd = cdBase / (hs?.cannonDpsMult || 1);
    if (this.fireTimer > 0) return;
    this.fireTimer = cd;

    const spread = this._cannonPattern();
    const dmg = Math.round((8 + this.weaponLevel + (hs?.cannonDamageBonus || 0)) * (this.damageMult || 1));
    for (const offset of spread) {
      bulletPool.spawnPlayerBullet(this.x + offset, this.y - 18, 520, dmg);
    }

    const wing = hs?.wingLevel || 0;
    if (this.missileSwarm && hs?.missileSalvo > 0) {
      this.missileTimer -= dt;
      if (this.missileTimer <= 0) {
        this.missileTimer = (hs.missileInterval || 2.5) * 0.85;
        bulletPool.fireHomingMissiles(this, enemies, hs.missileSalvo + 2, dmg);
      }
    } else if (wing >= 1) {
      bulletPool.spawnPlayerBullet(this.x - 22, this.y - 8, 480, dmg - 2);
      bulletPool.spawnPlayerBullet(this.x + 22, this.y - 8, 480, dmg - 2);
    }
    if (wing >= 2) {
      bulletPool.spawnPlayerBullet(this.x - 32, this.y - 4, 440, dmg - 3);
      bulletPool.spawnPlayerBullet(this.x + 32, this.y - 4, 440, dmg - 3);
    }

    if (!this.missileSwarm && hs?.missileSalvo > 0) {
      this.missileTimer -= dt;
      if (this.missileTimer <= 0) {
        this.missileTimer = hs.missileInterval || 2.5;
        bulletPool.fireHomingMissiles(this, enemies, hs.missileSalvo, dmg + 4);
      }
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
    if (this.invuln > 0 || this.energyShieldActive > 0) return false;
    const hs = this.hangarStats;
    const scaled = Math.round(amount * (hs?.ramDamageMult || 1));
    this.shield -= scaled;
    this.hitFlash = 0.45;
    this.invuln = 1.5;
    if (this.shield <= 0) {
      this.shield = 0;
      return true;
    }
    return false;
  }

  activateEnergyShield() {
    this.energyShieldActive = 3;
    this.invuln = 3;
    this.shield = this.maxShield;
  }

  activateLaser() {
    this.laserActive = 2.5;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.04) * 0.25;
    } else if (this.invuln > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }

    if (this.energyShieldActive > 0) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 + Math.sin(Date.now() * 0.015) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.laserActive > 0) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.fillRect(-3, -320, 6, 300);
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
    if (this.energyShieldActive > 0) this.energyShieldActive -= dt;
    if (this.laserActive > 0) this.laserActive -= dt;
  }
}
