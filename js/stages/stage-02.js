/** Stage 2 — Fleet Assault (mirrors data/stages/stage-02.json). */
window.SKY_FORCE_STAGES = window.SKY_FORCE_STAGES || {};
window.SKY_FORCE_STAGES['stage-02'] = {
  id: 2,
  name: 'Fleet Assault',
  subtitle: 'Sector 12 — Capital Line',
  theme: 'fleet',
  hostageCount: 3,
  unlockStars: 0,
  difficultyMultipliers: {
    normal: { enemyHp: 1.18, bulletSpeed: 1.05, starReward: 1.1 },
  },
  timeline: [
    { atSec: 0, action: 'banner', text: 'SECTOR 12 — FLEET ASSAULT', kind: 'stage' },
    { atSec: 0, action: 'setSection', section: 1 },
    { atSec: 4, action: 'banner', text: 'COASTAL BATTERIES', kind: 'wave' },
    { atSec: 5, action: 'spawnGroup', enemies: [
      { type: 'turret', x: 0.2, y: 0.68 },
      { type: 'turret', x: 0.8, y: 0.7 },
      { type: 'turret', x: 0.5, y: 0.74 },
    ] },
    { atSec: 8, action: 'spawnDestructible', destructible: 'radar', x: 0.5, y: 0.76 },
    { atSec: 14, action: 'spawnGroup', enemies: [
      { type: 'tank', x: 0.3, y: 0.72 },
      { type: 'tank', x: 0.7, y: 0.72 },
    ] },
    { atSec: 16, action: 'spawnHostage', id: 'h1', x: 0.25, y: 0.6 },
    { atSec: 18, action: 'setSection', section: 2 },
    { atSec: 18, action: 'banner', text: 'HEAVY PLATOON', kind: 'wave' },
    { atSec: 20, action: 'spawnGroup', enemies: [
      { type: 'turret', x: 0.35, y: 0.72 },
      { type: 'turret', x: 0.65, y: 0.72 },
      { type: 'tank', x: 0.5, y: 0.76, elite: true },
    ] },
    { atSec: 26, action: 'spawnDestructible', destructible: 'crate', x: 0.15, y: 0.74 },
    { atSec: 28, action: 'spawnDestructible', destructible: 'crate', x: 0.85, y: 0.72 },
    { atSec: 32, action: 'spawnHostage', id: 'h2', x: 0.5, y: 0.58 },
    { atSec: 36, action: 'spawnGroup', enemies: [
      { type: 'tank', x: 0.22, y: 0.7 },
      { type: 'tank', x: 0.78, y: 0.7 },
      { type: 'turret', x: 0.5, y: 0.75 },
    ] },
    { atSec: 42, action: 'setSection', section: 3 },
    { atSec: 42, action: 'banner', text: 'BOMBARDMENT', kind: 'wave' },
    { atSec: 44, action: 'spawnGroup', enemies: [
      { type: 'turret', x: 0.15, y: 0.68 },
      { type: 'turret', x: 0.85, y: 0.68 },
      { type: 'tank', x: 0.35, y: 0.74 },
      { type: 'tank', x: 0.65, y: 0.74 },
      { type: 'turret', x: 0.5, y: 0.77 },
    ] },
    { atSec: 48, action: 'spawnHostage', id: 'h3', x: 0.72, y: 0.62 },
    { atSec: 52, action: 'spawnDestructible', destructible: 'fuel', x: 0.28, y: 0.78 },
    { atSec: 55, action: 'spawnDestructible', destructible: 'fuel', x: 0.72, y: 0.76 },
    { atSec: 58, action: 'spawnGroup', enemies: [
      { type: 'tank', x: 0.4, y: 0.73 },
      { type: 'tank', x: 0.6, y: 0.73 },
      { type: 'tank', x: 0.5, y: 0.76, elite: true },
    ] },
    { atSec: 62, action: 'setSection', section: 4 },
    { atSec: 62, action: 'banner', text: 'DREADNOUGHT APPROACHING', kind: 'boss' },
    { atSec: 66, action: 'spawnBoss', type: 'dreadnought', hp: 5200, name: 'DREADNOUGHT', radius: 44, fireScale: 1.05 },
  ],
  medals: {
    annihilation70: { threshold: 0.7 },
    annihilation100: { threshold: 1 },
    rescueAll: { survivorIds: [] },
  },
  clearBonusStars: 75,
};

window.SKY_FORCE_STAGE_ORDER = window.SKY_FORCE_STAGE_ORDER || ['stage-01', 'stage-02'];
