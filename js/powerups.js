const COLORS = {
  weapon: '#c084fc',
  shield: '#34d399',
  life: '#fb923c',
};

export class PowerUpManager {
  constructor() {
    this.list = [];
  }

  spawn(x, y, type) {
    this.list.push({
      x,
      y,
      type: type || 'weapon',
      radius: 10,
      active: true,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  update(dt, drift) {
    for (const p of this.list) {
      if (!p.active) continue;
      p.y += drift * dt;
      p.wobble += dt * 4;
      p.x += Math.sin(p.wobble) * 20 * dt;
    }
  }

  prune() {
    this.list = this.list.filter((p) => p.active);
  }

  draw(ctx) {
    for (const p of this.list) {
      if (!p.active) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.strokeStyle = COLORS[p.type] || '#fff';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS[p.type];
      ctx.font = 'bold 10px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = p.type === 'weapon' ? 'W' : p.type === 'shield' ? 'S' : '♥';
      ctx.fillText(label, 0, 1);
      ctx.restore();
    }
  }
}
