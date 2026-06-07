class StarManager {
  constructor() {
    this.list = [];
  }

  spawn(x, y, value = 10) {
    this.list.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: 30 + Math.random() * 20,
      value,
      radius: 6,
      active: true,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  update(dt, drift, player, magnetRadius = 0, magnetStrength = 0) {
    for (const s of this.list) {
      if (!s.active) continue;
      s.wobble += dt * 5;
      if (player && magnetRadius > 0) {
        const dx = player.x - s.x;
        const dy = player.y - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRadius && dist > 1) {
          const pull = magnetStrength / dist;
          s.vx += dx * pull * dt * 0.02;
          s.vy += dy * pull * dt * 0.02;
        }
      }
      s.x += s.vx * dt + Math.sin(s.wobble) * 15 * dt;
      s.y += (s.vy + drift) * dt;
    }
    this.list = this.list.filter((s) => s.active && s.y < 680);
  }

  draw(ctx) {
    for (const s of this.list) {
      if (!s.active) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(0, -s.radius * 1.1);
      ctx.lineTo(s.radius * 0.32, -s.radius * 0.32);
      ctx.lineTo(s.radius * 1.05, 0);
      ctx.lineTo(s.radius * 0.32, s.radius * 0.32);
      ctx.lineTo(0, s.radius * 1.1);
      ctx.lineTo(-s.radius * 0.32, s.radius * 0.32);
      ctx.lineTo(-s.radius * 1.05, 0);
      ctx.lineTo(-s.radius * 0.32, -s.radius * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, s.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  prune() {
    this.list = this.list.filter((s) => s.active);
  }
}
