/** Lightweight burst particles — explosions, hit sparks. */
class FxManager {
  constructor() {
    this.list = [];
  }

  burst(x, y, opts = {}) {
    const count = opts.count ?? 10;
    const color = opts.color ?? '#fbbf24';
    const speed = opts.speed ?? 120;
    const life = opts.life ?? 0.45;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = speed * (0.45 + Math.random() * 0.65);
      this.list.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life,
        maxLife: life,
        radius: 2 + Math.random() * 3,
        color,
      });
    }
  }

  hitSpark(x, y) {
    this.burst(x, y, { count: 6, speed: 80, life: 0.25, color: '#fef08a' });
  }

  starShower(x, y) {
    this.burst(x, y, { count: 14, speed: 100, life: 0.55, color: '#fbbf24' });
  }

  update(dt) {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.list) {
      const a = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }
}
