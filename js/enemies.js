const TYPES = {
  scout: {
    hp: 12,
    radius: 10,
    speed: 90,
    points: 100,
    color: '#fb923c',
    accent: '#fde047',
    dropChance: 0.12,
    dropType: 'weapon',
    fireRate: 0,
    label: 'SCOUT',
  },
  fighter: {
    hp: 28,
    radius: 15,
    speed: 70,
    points: 250,
    color: '#a855f7',
    accent: '#22d3ee',
    dropChance: 0.18,
    dropType: 'shield',
    fireRate: 0,
    label: 'FIGHTER',
  },
  tank: {
    hp: 55,
    radius: 22,
    speed: 45,
    points: 500,
    color: '#ef4444',
    accent: '#78716c',
    dropChance: 0.25,
    dropType: 'weapon',
    fireRate: 0,
    label: 'TANK',
  },
  diver: {
    hp: 16,
    radius: 11,
    speed: 115,
    points: 180,
    color: '#06b6d4',
    accent: '#a5f3fc',
    dropChance: 0.22,
    dropType: 'weapon',
    fireRate: 0,
    label: 'DIVER',
  },
};

function makeEnemy(typeKey, x, y, wave, opts = {}) {
  const t = TYPES[typeKey];
  const bal = window.ENEMY_BALANCE || {};
  let fireRate = t.fireRate;
  if (typeKey === 'fighter') fireRate = bal.fighterFireRate ?? 2.65;
  if (typeKey === 'tank') fireRate = bal.tankFireRate ?? 3.35;
  const enemy = {
    type: typeKey,
    x,
    y,
    hp: t.hp + wave * 4,
    maxHp: t.hp + wave * 4,
    radius: t.radius,
    speed: t.speed + wave * 3,
    points: t.points,
    color: t.color,
    accent: t.accent,
    label: t.label,
    dropChance: t.dropChance,
    dropType: t.dropType,
    fireRate,
    fireTimer: Math.random() * 2,
    sway: Math.random() * Math.PI * 2,
    vx: opts.vx || 0,
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
  if (opts.elite) {
    enemy.elite = true;
    enemy.hp = Math.round(enemy.hp * 1.85);
    enemy.maxHp = enemy.hp;
    enemy.points = Math.round(enemy.points * 1.6);
    enemy.dropChance = 1;
    enemy.color = '#fbbf24';
    enemy.accent = '#fef08a';
    enemy.label = `ELITE ${enemy.label}`;
  }
  return enemy;
}

function drawScout(ctx, e) {
  ctx.fillStyle = e.color;
  ctx.strokeStyle = e.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, e.radius);
  ctx.lineTo(e.radius * 0.55, -e.radius * 0.2);
  ctx.lineTo(0, -e.radius * 0.85);
  ctx.lineTo(-e.radius * 0.55, -e.radius * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = e.accent;
  ctx.fillRect(-e.radius * 0.9, -e.radius * 0.15, e.radius * 0.35, 3);
  ctx.fillRect(e.radius * 0.55, -e.radius * 0.15, e.radius * 0.35, 3);
}

function drawFighter(ctx, e) {
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(-e.radius * 0.35, -e.radius * 0.5, e.radius * 0.7, e.radius * 1.1);
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.moveTo(0, e.radius);
  ctx.lineTo(e.radius * 0.95, -e.radius * 0.35);
  ctx.lineTo(0, -e.radius * 0.75);
  ctx.lineTo(-e.radius * 0.95, -e.radius * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = e.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = e.accent;
  ctx.beginPath();
  ctx.arc(-e.radius * 0.55, e.radius * 0.15, 3, 0, Math.PI * 2);
  ctx.arc(e.radius * 0.55, e.radius * 0.15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0abfc';
  ctx.fillRect(-e.radius * 1.05, -e.radius * 0.1, e.radius * 0.45, 4);
  ctx.fillRect(e.radius * 0.6, -e.radius * 0.1, e.radius * 0.45, 4);
}

function drawTank(ctx, e) {
  const w = e.radius * 1.1;
  const h = e.radius * 0.65;
  ctx.fillStyle = e.accent;
  ctx.fillRect(-w, -h * 0.2, w * 2, h * 1.4);
  ctx.fillStyle = e.color;
  ctx.fillRect(-w * 0.85, -h, w * 1.7, h * 1.2);
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w * 0.85, -h, w * 1.7, h * 1.2);
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.arc(0, -h * 0.55, h * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(-3, -h * 1.2, 6, h * 0.5);
}

function drawDiver(ctx, e) {
  ctx.fillStyle = e.color;
  ctx.strokeStyle = e.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, e.radius * 1.1);
  ctx.lineTo(e.radius * 0.7, -e.radius * 0.3);
  ctx.lineTo(0, -e.radius);
  ctx.lineTo(-e.radius * 0.7, -e.radius * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = e.accent;
  ctx.fillRect(-e.radius * 1.2, 0, e.radius * 0.5, 3);
  ctx.fillRect(e.radius * 0.7, 0, e.radius * 0.5, 3);
}

class EnemyManager {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.list = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.2;
    this.spawnPaused = false;
  }

  setSpawnPaused(paused) {
    this.spawnPaused = paused;
  }

  spawn(type, x, y, wave, opts = {}) {
    const enemy = makeEnemy(type, x, y, wave, opts);
    if (opts.difficultyHpMult) {
      enemy.hp = Math.round(enemy.hp * opts.difficultyHpMult);
      enemy.maxHp = enemy.hp;
    } else if (opts.hpMult && opts.hpMult !== 1) {
      enemy.hp = Math.round(enemy.hp * opts.hpMult);
      enemy.maxHp = enemy.hp;
    }
    this.list.push(enemy);
    return enemy;
  }

  update(dt, wave, drift) {
    if (!this.spawnPaused) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this._spawnWave(wave);
        this.spawnTimer = Math.max(0.45, this.spawnInterval - wave * 0.05);
      }
    }

    for (const e of this.list) {
      if (!e.alive) continue;
      e.y += e.speed * dt + drift * dt;
      if (e.type === 'diver') {
        e.x += e.vx * dt;
      } else {
        e.x += Math.sin(e.sway + e.y * 0.02) * 30 * dt;
      }
      e.fireTimer -= dt;
    }

    this.list = this.list.filter((e) => e.alive && e.y < this.h + 40);
  }

  _spawnWave(wave) {
    const pattern = Math.floor(Math.random() * 4);
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
    } else if (pattern === 2) {
      for (let i = 0; i < 5; i += 1) {
        const x = 40 + (this.w - 80) * (i / 4);
        this.list.push(makeEnemy(i % 2 ? 'scout' : 'fighter', x, -20 - i * 35, wave));
      }
    } else {
      const slots = [0.15, 0.35, 0.65, 0.85];
      for (const slot of slots) {
        const x = this.w * slot;
        const vx = (this.w / 2 - x) * 0.55;
        this.list.push(makeEnemy('diver', x, -25, wave, { vx }));
      }
    }

    if (wave >= 2 && wave % 3 === 0) {
      this.list.push(makeEnemy('fighter', this.w * 0.5, -60, wave, { elite: true }));
    }
  }

  tryFire(bulletPool, player, dt, wave = 1, bulletMult = 1) {
    const bal = window.ENEMY_BALANCE || {};
    let shots = 0;
    const maxShots = bal.maxShootersPerTick ?? 4;
    for (const e of this.list) {
      if (shots >= maxShots) break;
      if (!e.alive || e.fireRate <= 0 || e.fireTimer > 0) continue;
      if (e.y < 40 || e.y > this.h * 0.65) continue;
      if (Math.random() < (bal.fireSkipChance ?? 0)) continue;
      e.fireTimer = e.fireRate;
      shots += 1;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = Math.min(
        bal.bulletSpeedCap ?? 205,
        ((bal.bulletSpeedBase ?? 165) + wave * (bal.bulletSpeedWave ?? 1.5)) * bulletMult,
      );
      const damage = 6 + Math.max(0, wave - 2);
      bulletPool.spawnEnemyBullet(e.x, e.y + e.radius, (dx / len) * speed, (dy / len) * speed, damage);
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

      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.type === 'tank' ? 10 : 6;

      if (e.type === 'scout') drawScout(ctx, e);
      else if (e.type === 'fighter') drawFighter(ctx, e);
      else if (e.type === 'diver') drawDiver(ctx, e);
      else drawTank(ctx, e);

      ctx.shadowBlur = 0;
      if (e.elite) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      const hpPct = e.hp / e.maxHp;
      if (hpPct <= 0.5 && hpPct > 0.25) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 4, e.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (hpPct <= 0.25) {
        ctx.fillStyle = 'rgba(251, 146, 60, 0.7)';
        for (let sp = 0; sp < 3; sp += 1) {
          ctx.fillRect(-e.radius + sp * 6, -e.radius * 0.2, 2, 4);
        }
      }

      const barW = e.type === 'tank' ? 40 : e.type === 'fighter' ? 32 : 24;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-barW / 2, -e.radius - 14, barW, 4);
      ctx.fillStyle = e.type === 'tank' ? '#f87171' : e.type === 'fighter' ? '#c084fc' : '#fdba74';
      ctx.fillRect(-barW / 2, -e.radius - 14, barW * hpPct, 4);

      if (e.type !== 'scout') {
        ctx.font = 'bold 7px Rajdhani, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.textAlign = 'center';
        ctx.fillText(e.label, 0, -e.radius - 18);
      }

      ctx.restore();
    }
  }
}
