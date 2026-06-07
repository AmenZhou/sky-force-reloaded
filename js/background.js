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
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.45, '#0f172a');
    grad.addColorStop(1, '#172554');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    for (const c of this.clouds) {
      ctx.fillStyle = `rgba(148, 163, 184, ${c.alpha})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.w * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const layer of this.layers) {
      for (const s of layer.stars) {
        ctx.fillStyle = `rgba(226, 232, 240, ${s.brightness})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    }
  }
}
