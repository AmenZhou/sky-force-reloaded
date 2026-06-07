/**
 * Data-driven stage runner — parses JSON timeline and commands spawns.
 * Coordinates are normalized 0–1 unless noted; multiplied by stage width/height at runtime.
 */
class StageDirector {
  constructor(w, h, enemyManager, callbacks = {}) {
    this.w = w;
    this.h = h;
    this.enemies = enemyManager;
    this.callbacks = callbacks;
    this.stage = null;
    this.elapsed = 0;
    this.eventIndex = 0;
    this.difficulty = 'normal';
    this.running = false;
    this.killStats = { spawned: 0, killed: 0 };
    this.survivorsRescued = new Set();
  }

  async load(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Stage load failed: ${url}`);
    this.stage = await res.json();
    return this.stage;
  }

  loadFromObject(data) {
    this.stage = data;
    return this.stage;
  }

  start(difficulty = 'normal') {
    if (!this.stage) throw new Error('No stage loaded');
    this.difficulty = difficulty;
    this.elapsed = 0;
    this.eventIndex = 0;
    this.running = true;
    this.killStats = { spawned: 0, killed: 0 };
    this.survivorsRescued = new Set();
  }

  stop() {
    this.running = false;
  }

  get multiplier() {
    return this.stage?.difficultyMultipliers?.[this.difficulty] || { enemyHp: 1, bulletSpeed: 1, starReward: 1 };
  }

  update(dt, scrollSpeed) {
    if (!this.running || !this.stage) return;
    this.elapsed += dt;

    while (this.eventIndex < this.stage.timeline.length) {
      const ev = this.stage.timeline[this.eventIndex];
      if (ev.atSec > this.elapsed) break;
      this._dispatch(ev);
      this.eventIndex += 1;
    }
  }

  _dispatch(ev) {
    switch (ev.action) {
      case 'banner':
        this.callbacks.onBanner?.(ev.text);
        break;
      case 'spawn':
        this._spawnAt(ev.enemy, ev.x * this.w, ev.y * this.h, ev);
        break;
      case 'spawnGroup':
        for (const spec of ev.enemies) {
          if (spec.x != null) {
            this._spawnAt(spec.type, spec.x * this.w, spec.y * this.h, spec);
          } else {
            this.callbacks.onSpawnPath?.(spec);
          }
        }
        break;
      case 'spawnSurvivor':
        this.callbacks.onSpawnSurvivor?.(ev);
        break;
      case 'spawnBoss':
        this.callbacks.onSpawnBoss?.(ev);
        break;
      case 'stageComplete':
        this.running = false;
        this.callbacks.onStageComplete?.(this._medalSnapshot());
        break;
      default:
        console.warn('Unknown stage action:', ev.action);
    }
  }

  _spawnAt(type, x, y, ev) {
    this.killStats.spawned += 1;
    this.callbacks.onSpawnEnemy?.(type, x, y, {
      hpMult: this.multiplier.enemyHp,
      pattern: ev.pattern,
      patternIntervalSec: ev.patternIntervalSec,
    });
  }

  _medalSnapshot() {
    const m = this.stage.medals || {};
    const killPct = this.killStats.spawned ? this.killStats.killed / this.killStats.spawned : 0;
    return {
      completion: true,
      annihilation70: killPct >= (m.annihilation70?.threshold || 0.7),
      annihilation100: killPct >= (m.annihilation100?.threshold || 1),
      rescueAll: (m.rescueAll?.survivorIds || []).every((id) => this.survivorsRescued.has(id)),
    };
  }

  onEnemyKilled() {
    this.killStats.killed += 1;
  }

  onSurvivorRescued(id) {
    this.survivorsRescued.add(id);
  }
}
