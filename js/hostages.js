class HostageManager {
  constructor() {
    this.list = [];
    this.rescueDuration = 2.5;
    this.totalSpawned = 0;
    this.rescuedCount = 0;
  }

  spawn(id, x, y) {
    this.totalSpawned += 1;
    this.list.push({
      id,
      x,
      y,
      radius: 26,
      progress: 0,
      rescued: false,
      active: true,
      sway: Math.random() * Math.PI * 2,
    });
  }

  update(dt, player, onRescued) {
    for (const h of this.list) {
      if (!h.active || h.rescued) continue;
      h.sway += dt * 2;
      const dist = Math.hypot(player.x - h.x, player.y - h.y);
      if (dist < h.radius + player.hitboxRadius + 8) {
        h.progress += dt / this.rescueDuration;
        if (h.progress >= 1) {
          h.rescued = true;
          h.active = false;
          this.rescuedCount += 1;
          onRescued?.(h);
        }
      } else {
        h.progress = Math.max(0, h.progress - dt * 0.5);
      }
    }
    this.list = this.list.filter((h) => h.active);
  }

  get allRescued() {
    return this.totalSpawned > 0 && this.rescuedCount >= this.totalSpawned;
  }

  draw(ctx) {
    for (const h of this.list) {
      if (!h.active) continue;
      ctx.save();
      ctx.translate(h.x, h.y + Math.sin(h.sway) * 2);

      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (h.progress > 0) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, h.radius - 4, -Math.PI / 2, -Math.PI / 2 + h.progress * Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(0, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-4, -1, 8, 10);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-6, 9, 4, 5);
      ctx.fillRect(2, 9, 4, 5);

      ctx.font = 'bold 8px Rajdhani,sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('HELP!', 0, -14);
      ctx.restore();
    }
  }
}
