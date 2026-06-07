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
    if (theme === 'terrain' || theme === 'fleet') this.theme = theme;
    else this.theme = 'space';
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
    const sky = ctx.createLinearGradient(0, 0, 0, this.h * 0.55);
    sky.addColorStop(0, '#0ea5e9');
    sky.addColorStop(0.45, '#7dd3fc');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.w, this.h * 0.55);

    this._drawCloudDeck(ctx);

    const horizon = this.h * 0.52 + Math.sin(this.scrollY * 0.004) * 3;
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, horizon, this.w, 6);

    this._drawHorizonHaze(ctx, horizon);

    const ground = ctx.createLinearGradient(0, horizon, 0, this.h);
    ground.addColorStop(0, '#65a30d');
    ground.addColorStop(0.35, '#4d7c0f');
    ground.addColorStop(0.7, '#3f6212');
    ground.addColorStop(1, '#365314');
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon + 6, this.w, this.h - horizon);

    ctx.strokeStyle = 'rgba(54, 83, 20, 0.45)';
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 8; row += 1) {
      const y = horizon + 24 + ((row * 48 + this.scrollY * 0.35) % (this.h - horizon));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.w, y + 4);
      ctx.stroke();
    }

    for (const crack of this.terrainCracks) {
      const cy = horizon + 20 + ((crack.y + this.scrollY * 0.28) % (this.h - horizon - 40));
      ctx.beginPath();
      ctx.moveTo(crack.x, cy);
      ctx.lineTo(
        crack.x + Math.cos(crack.angle) * crack.len,
        cy + Math.sin(crack.angle) * crack.len * 0.25,
      );
      ctx.stroke();
    }

    for (let i = 0; i < 6; i += 1) {
      const px = (i * 67 + this.scrollY * 0.2) % this.w;
      const py = horizon + 40 + (i % 3) * 36;
      ctx.fillStyle = 'rgba(63, 98, 18, 0.35)';
      ctx.fillRect(px, py, 36 + (i % 2) * 14, 10);
    }

    this._drawEdgeClouds(ctx);
  }

  _drawFleet(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, this.h * 0.5);
    sky.addColorStop(0, '#1e3a5f');
    sky.addColorStop(0.5, '#475569');
    sky.addColorStop(1, '#94a3b8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.w, this.h * 0.5);

    this._drawCloudDeck(ctx, 0.92);

    const horizon = this.h * 0.48 + Math.sin(this.scrollY * 0.003) * 2;
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, horizon, this.w, 8);

    this._drawHorizonHaze(ctx, horizon);

    const ground = ctx.createLinearGradient(0, horizon, 0, this.h);
    ground.addColorStop(0, '#475569');
    ground.addColorStop(0.5, '#334155');
    ground.addColorStop(1, '#1e293b');
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon + 8, this.w, this.h - horizon);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 6; row += 1) {
      const y = (row * 110 + this.scrollY * 0.22) % (this.h + 120) - 60;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.w, y + 8);
      ctx.stroke();
    }

    for (let i = 0; i < 10; i += 1) {
      const px = (i * 67 + this.scrollY * 0.18) % this.w;
      const py = this.h * 0.55 + (i % 4) * 28 + Math.sin(this.scrollY * 0.01 + i) * 6;
      ctx.fillStyle = 'rgba(51, 65, 85, 0.85)';
      ctx.fillRect(px, py, 48 + (i % 3) * 12, 14);
      ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.fillRect(px + 8, py - 18, 6, 18);
    }

    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    for (let i = 0; i < 4; i += 1) {
      const fx = (i * 120 + this.scrollY * 0.35) % this.w;
      const fy = (i * 90 + this.scrollY * 0.25) % (this.h * 0.5);
      ctx.beginPath();
      ctx.arc(fx, fy, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    this._drawEdgeClouds(ctx);
  }

  getHorizonY() {
    if (this.theme === 'fleet') {
      return this.h * 0.48 + Math.sin(this.scrollY * 0.003) * 2;
    }
    if (this.theme === 'terrain') {
      return this.h * 0.52 + Math.sin(this.scrollY * 0.004) * 3;
    }
    return this.h * 0.72;
  }

  _drawCloudDeck(ctx, alphaScale = 1) {
    const deckBottom = this.h * 0.24;
    const drift = this.scrollY * 0.06;
    const puffs = [
      { x: 0.08, y: 0.06, w: 0.22, h: 0.05 },
      { x: 0.32, y: 0.04, w: 0.28, h: 0.06 },
      { x: 0.58, y: 0.07, w: 0.24, h: 0.05 },
      { x: 0.82, y: 0.05, w: 0.2, h: 0.055 },
      { x: 0.18, y: 0.14, w: 0.26, h: 0.055 },
      { x: 0.48, y: 0.12, w: 0.3, h: 0.06 },
      { x: 0.72, y: 0.15, w: 0.22, h: 0.05 },
    ];
    for (const puff of puffs) {
      const px = ((puff.x * this.w + drift * (0.4 + puff.x)) % (this.w + 120)) - 60;
      const py = puff.y * this.h;
      const pw = puff.w * this.w;
      const ph = puff.h * this.h;
      const g = ctx.createRadialGradient(px, py + ph * 0.4, 0, px, py + ph * 0.4, pw * 0.55);
      g.addColorStop(0, `rgba(255, 255, 255, ${0.78 * alphaScale})`);
      g.addColorStop(0.55, `rgba(248, 250, 252, ${0.42 * alphaScale})`);
      g.addColorStop(1, 'rgba(248, 250, 252, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py + ph * 0.5, pw * 0.5, ph * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px - pw * 0.22, py + ph * 0.35, pw * 0.28, ph * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + pw * 0.24, py + ph * 0.38, pw * 0.26, ph * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const haze = ctx.createLinearGradient(0, deckBottom - 40, 0, deckBottom + 30);
    haze.addColorStop(0, `rgba(255, 255, 255, ${0.12 * alphaScale})`);
    haze.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, deckBottom - 40, this.w, 70);
  }

  _drawHorizonHaze(ctx, horizon) {
    const band = ctx.createLinearGradient(0, horizon - 50, 0, horizon + 36);
    band.addColorStop(0, 'rgba(186, 230, 253, 0)');
    band.addColorStop(0.45, 'rgba(148, 163, 184, 0.12)');
    band.addColorStop(1, 'rgba(51, 65, 85, 0.08)');
    ctx.fillStyle = band;
    ctx.fillRect(0, horizon - 50, this.w, 86);
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
    else if (this.theme === 'fleet') this._drawFleet(ctx);
    else this._drawSpace(ctx);
  }
}
