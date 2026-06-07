class Background {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.layers = [
      { stars: this._makeStars(40, 0.2, 1), speed: 0.15 },
      { stars: this._makeStars(30, 0.5, 2), speed: 0.4 },
      { stars: this._makeStars(18, 0.85, 3), speed: 0.9 },
    ];
    this.clouds = Array.from({ length: 6 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      w: 60 + Math.random() * 80,
      speed: 0.25 + Math.random() * 0.35,
      alpha: 0.04 + Math.random() * 0.06,
    }));
  }

  _makeStars(count, brightness, size) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      brightness,
      size,
    }));
  }

  update(dt, scrollSpeed) {
    for (const layer of this.layers) {
      for (const s of layer.stars) {
        s.y += scrollSpeed * layer.speed * dt;
        if (s.y > this.h) {
          s.y = -4;
          s.x = Math.random() * this.w;
        }
      }
    }
    for (const c of this.clouds) {
      c.y += scrollSpeed * c.speed * dt;
      if (c.y > this.h + 40) {
        c.y = -60;
        c.x = Math.random() * this.w;
      }
    }
  }

  draw(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.35, '#0c1445');
    grad.addColorStop(0.7, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    for (const c of this.clouds) {
      const nebula = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w);
      nebula.addColorStop(0, `rgba(56, 189, 248, ${c.alpha * 1.2})`);
      nebula.addColorStop(0.5, `rgba(168, 85, 247, ${c.alpha * 0.6})`);
      nebula.addColorStop(1, 'rgba(30, 27, 75, 0)');
      ctx.fillStyle = nebula;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.w * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const starColors = ['#e2e8f0', '#67e8f9', '#fbbf24', '#c4b5fd'];
    for (const layer of this.layers) {
      for (const s of layer.stars) {
        const tint = starColors[Math.floor(s.x * 0.07 + s.y * 0.03) % starColors.length];
        ctx.globalAlpha = s.brightness;
        ctx.fillStyle = tint;
        ctx.shadowColor = tint;
        ctx.shadowBlur = s.size > 1.5 ? 4 : 0;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}
