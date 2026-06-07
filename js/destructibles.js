class DestructibleManager {
  constructor() {
    this.list = [];
  }

  spawn(type, x, y, opts = {}) {
    const spec = this._spec(type);
    if (!spec) return;
    this.list.push({
      type,
      x,
      y,
      hp: spec.hp,
      maxHp: spec.hp,
      radius: spec.radius,
      width: spec.width,
      height: spec.height,
      active: true,
      scrollWithMap: spec.scrollWithMap !== false,
      dropProfile: spec.dropProfile,
      label: spec.label,
    });
  }

  _spec(type) {
    const specs = {
      crate: {
        hp: 18,
        radius: 16,
        label: 'CRATE',
        dropProfile: 'crate',
        scrollWithMap: true,
      },
      radar: {
        hp: 120,
        radius: 28,
        width: 36,
        height: 48,
        label: 'RADAR',
        dropProfile: 'radar',
        scrollWithMap: true,
      },
      fuel: {
        hp: 90,
        radius: 24,
        width: 32,
        height: 40,
        label: 'FUEL',
        dropProfile: 'radar',
        scrollWithMap: true,
      },
    };
    return specs[type];
  }

  update(dt, scrollDrift) {
    for (const d of this.list) {
      if (!d.active) continue;
      if (d.scrollWithMap) d.y += scrollDrift * dt;
    }
    this.list = this.list.filter((d) => d.active && d.y < 700);
  }

  takeDamage(d, amount) {
    d.hp -= amount;
    if (d.hp <= 0) {
      d.active = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    for (const d of this.list) {
      if (!d.active) continue;
      ctx.save();
      ctx.translate(d.x, d.y);
      const pct = d.hp / d.maxHp;

      if (d.type === 'crate') {
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.fillRect(-14, -14, 28, 28);
        ctx.strokeRect(-14, -14, 28, 28);
        ctx.strokeStyle = '#92400e';
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 14);
        ctx.stroke();
      } else if (d.type === 'radar') {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = pct > 0.5 ? '#94a3b8' : '#f97316';
        ctx.lineWidth = 2;
        ctx.fillRect(-18, -8, 36, 40);
        ctx.strokeRect(-18, -8, 36, 40);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, -18, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(0, -18, 8, -0.8, 0.8);
        ctx.stroke();
      } else if (d.type === 'fuel') {
        ctx.fillStyle = '#450a0a';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 4, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 8px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText('FUEL', 0, 8);
      }

      if (pct < 1 && pct < 0.99) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(-20, 22, 40, 4);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(-20, 22, 40 * pct, 4);
      }
      ctx.restore();
    }
  }

  prune() {
    this.list = this.list.filter((d) => d.active);
  }
}

class RunLootManager {
  constructor() {
    this.list = [];
  }

  spawn(x, y, kind, payload) {
    this.list.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: 20,
      kind,
      payload,
      radius: 14,
      active: true,
      pulse: 0,
    });
  }

  update(dt, drift, player, magnetRadius, magnetStrength) {
    for (const item of this.list) {
      if (!item.active) continue;
      item.pulse += dt * 4;
      if (player && magnetRadius > 0) {
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRadius + 20 && dist > 1) {
          const pull = magnetStrength / dist;
          item.vx += dx * pull * dt * 0.015;
          item.vy += dy * pull * dt * 0.015;
        }
      }
      item.x += item.vx * dt;
      item.y += (item.vy + drift) * dt;
    }
    this.list = this.list.filter((i) => i.active && i.y < 680);
  }

  draw(ctx) {
    for (const item of this.list) {
      if (!item.active) continue;
      ctx.save();
      ctx.translate(item.x, item.y + Math.sin(item.pulse) * 2);
      const isCard = item.kind === 'card';
      ctx.shadowColor = isCard ? '#a78bfa' : '#67e8f9';
      ctx.shadowBlur = 12;
      ctx.fillStyle = isCard ? '#4c1d95' : '#0c4a6e';
      ctx.strokeStyle = isCard ? '#c084fc' : '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isCard) {
        ctx.rect(-11, -14, 22, 28);
      } else {
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px Orbitron,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isCard ? 'CARD' : 'PART', 0, 3);
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  prune() {
    this.list = this.list.filter((i) => i.active);
  }
}

class MedalRunTracker {
  constructor(medalDefs, callbacks = {}) {
    this.defs = medalDefs;
    this.callbacks = callbacks;
    this.state = {
      destroy70: { earned: false, failed: false },
      destroy100: { earned: false, failed: false },
      rescueAll: { earned: false, failed: false },
      noHit: { earned: false, failed: false },
    };
    this.hostagesTotal = 0;
    this.hostagesRescued = 0;
  }

  reset(hostagesExpected = 0) {
    Object.keys(this.state).forEach((k) => {
      this.state[k] = { earned: false, failed: false };
    });
    this.hostagesTotal = hostagesExpected;
    this.hostagesRescued = 0;
  }

  onKillStats(spawned, killed) {
    if (spawned <= 0) return;
    const pct = killed / spawned;
    if (!this.state.destroy70.earned && !this.state.destroy70.failed && pct >= 0.7) {
      this.state.destroy70.earned = true;
      this.callbacks.onMedalEarned?.('destroy70', '✦ 70% Hostiles Destroyed');
    }
    if (!this.state.destroy100.earned && !this.state.destroy100.failed && killed >= spawned) {
      this.state.destroy100.earned = true;
      this.callbacks.onMedalEarned?.('destroy100', '✦ 100% Annihilation');
    }
  }

  onHostageRescued(totalSpawned, rescuedCount) {
    this.hostagesTotal = totalSpawned;
    this.hostagesRescued = rescuedCount;
    if (totalSpawned > 0 && rescuedCount >= totalSpawned
      && !this.state.rescueAll.earned && !this.state.rescueAll.failed) {
      this.state.rescueAll.earned = true;
      this.callbacks.onMedalEarned?.('rescueAll', '✦ All Humans Rescued');
    }
  }

  onPlayerDamaged() {
    if (!this.state.noHit.failed && !this.state.noHit.earned) {
      this.state.noHit.failed = true;
      this.callbacks.onMedalFailed?.('noHit');
    }
  }

  snapshotForClear(spawned, killed, hostages) {
    const killPct = spawned ? killed / spawned : 0;
    const medals = [];
    if (killPct >= 0.7) medals.push('destroy70');
    if (spawned > 0 && killed >= spawned) medals.push('destroy100');
    if (hostages.total > 0 && hostages.rescued >= hostages.total) medals.push('rescueAll');
    if (!this.state.noHit.failed) medals.push('noHit');
    return medals;
  }

  hudState() {
    return { ...this.state };
  }
}
