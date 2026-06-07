/** Stage 1 — Ground Assault (mirrors data/stages/stage-01.json). */
window.SKY_FORCE_STAGES = window.SKY_FORCE_STAGES || {};
window.SKY_FORCE_STAGES['stage-01'] = {
  id: 1,
  name: 'Scorched Line',
  subtitle: 'Sector 07 — Forward assault',
  theme: 'terrain',
  hostageCount: 2,
  unlockStars: 0,
  difficultyMultipliers: {
    normal: { enemyHp: 1, bulletSpeed: 1, starReward: 1 },
  },
  timeline: [
    { atSec: 0, action: 'banner', text: 'SECTOR 07 — SCORCHED LINE', kind: 'stage' },
    { atSec: 0, action: 'setSection', section: 1 },
    { atSec: 4, action: 'banner', text: 'GROUND BATTERIES', kind: 'wave' },
    { atSec: 5, action: 'spawnGroup', enemies: [
      { type: 'turret', x: 0.2, y: 0.7 },
      { type: 'turret', x: 0.8, y: 0.72 },
    ] },
    { atSec: 10, action: 'spawnDestructible', destructible: 'crate', x: 0.22, y: 0.76 },
    { atSec: 12, action: 'spawnDestructible', destructible: 'crate', x: 0.78, y: 0.74 },
    { atSec: 16, action: 'spawnGroup', enemies: [
      { type: 'turret', x: 0.5, y: 0.68 },
      { type: 'tank', x: 0.35, y: 0.74 },
    ] },
    { atSec: 22, action: 'spawnHostage', id: 'h1', x: 0.32, y: 0.6 },
    { atSec: 26, action: 'setSection', section: 2 },
    { atSec: 26, action: 'banner', text: 'ARMOR COLUMN', kind: 'wave' },
    { atSec: 28, action: 'spawnGroup', enemies: [
      { type: 'tank', x: 0.25, y: 0.72 },
      { type: 'tank', x: 0.75, y: 0.7 },
      { type: 'turret', x: 0.5, y: 0.76 },
    ] },
    { atSec: 34, action: 'spawnDestructible', destructible: 'radar', x: 0.5, y: 0.78 },
    { atSec: 38, action: 'spawnHostage', id: 'h2', x: 0.68, y: 0.58 },
    { atSec: 42, action: 'spawnGroup', enemies: [
      { type: 'turret', x: 0.18, y: 0.71 },
      { type: 'turret', x: 0.82, y: 0.71 },
      { type: 'tank', x: 0.5, y: 0.75, elite: true },
    ] },
    { atSec: 48, action: 'spawnDestructible', destructible: 'fuel', x: 0.18, y: 0.77 },
    { atSec: 50, action: 'spawnDestructible', destructible: 'fuel', x: 0.82, y: 0.75 },
    { atSec: 54, action: 'setSection', section: 3 },
    { atSec: 54, action: 'banner', text: 'SIEGE LINE', kind: 'wave' },
    { atSec: 56, action: 'spawnGroup', enemies: [
      { type: 'tank', x: 0.4, y: 0.73 },
      { type: 'tank', x: 0.6, y: 0.73 },
      { type: 'turret', x: 0.28, y: 0.68 },
      { type: 'turret', x: 0.72, y: 0.68 },
    ] },
    { atSec: 62, action: 'setSection', section: 4 },
    { atSec: 62, action: 'banner', text: 'FORTRESS CORE', kind: 'boss' },
    { atSec: 66, action: 'spawnBoss', type: 'debris-core', hp: 4200, name: 'FORTRESS CORE' },
  ],
  medals: {
    annihilation70: { threshold: 0.7 },
    annihilation100: { threshold: 1 },
    rescueAll: { survivorIds: [] },
  },
  clearBonusStars: 50,
};

window.SKY_FORCE_STAGE_ORDER = window.SKY_FORCE_STAGE_ORDER || ['stage-01', 'stage-02'];
