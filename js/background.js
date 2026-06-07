class Background {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.theme = 'space';
    this.scrollY = 0;
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
    this.terrainCracks = Array.from({ length: 24 }, (_, i) => ({
      x: (i * 47) % w,
      y: (i * 83) % h,
      len: 30 + (i % 5) * 18,
      angle: -0.3 + (i % 7) * 0.15,
    }));
    this.edgeClouds = [
      { side: 'left', offset: 0 },
      { side: 'right', offset: 0 },
    ];
  }

  setTheme(theme) {
    this.theme = theme === 'terrain' ? 'terrain' : 'space';
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
    this.scrollY += scrollSpeed * dt;
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
    for (const tc of this.terrainCracks) {
      tc.y += scrollSpeed * 0.28 * dt;
      if (tc.y > this.h + 40) {
        tc.y = -20;
        tc.x = Math.random() * this.w;
      }
    }
    this.edgeClouds.forEach((ec) => {
      ec.offset += scrollSpeed * 0.12 * dt;
    });
  }

  _drawSpace(ctx) {
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

  _drawTerrain(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#3d4f2f');
    grad.addColorStop(0.45, '#556b2f');
    grad.addColorStop(0.75, '#4a5d35');
    grad.addColorStop(1, '#2f3d24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.strokeStyle = 'rgba(35, 45, 28, 0.55)';
    ctx.lineWidth = 1.5;
    for (const crack of this.terrainCracks) {
      ctx.beginPath();
      ctx.moveTo(crack.x, crack.y);
      ctx.lineTo(
        crack.x + Math.cos(crack.angle) * crack.len,
        crack.y + Math.sin(crack.angle) * crack.len * 0.4 + crack.len * 0.15,
      );
      ctx.stroke();
    }

    for (let i = 0; i < 8; i += 1) {
      const px = (i * 53 + this.scrollY * 0.2) % this.w;
      const py = (i * 97 + this.scrollY * 0.15) % this.h;
      const pool = ctx.createRadialGradient(px, py, 0, px, py, 22);
      pool.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
      pool.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(px, py, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this._drawEdgeClouds(ctx);
  }

  _drawEdgeClouds(ctx) {
    for (const side of ['left', 'right']) {
      const cx = side === 'left' ? 0 : this.w;
      const g = ctx.createLinearGradient(
        side === 'left' ? 0 : this.w - 70,
        0,
        side === 'left' ? 90 : this.w,
        0,
      );
      if (side === 'left') {
        g.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        g.addColorStop(0, 'rgba(255, 255, 255, 0)');
        g.addColorStop(1, 'rgba(255, 255, 255, 0.22)');
      }
      ctx.fillStyle = g;
      ctx.fillRect(side === 'left' ? 0 : this.w - 72, 0, 72, this.h);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 5; i += 1) {
      const y = ((i * 140 + this.scrollY * 0.08) % (this.h + 80)) - 40;
      ctx.beginPath();
      ctx.ellipse(8, y, 28, 12, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.w - 8, y + 60, 32, 14, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  draw(ctx) {
    if (this.theme === 'terrain') this._drawTerrain(ctx);
    else this._drawSpace(ctx);
  }
}
