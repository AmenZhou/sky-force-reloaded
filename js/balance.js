/**
 * Combat balance knobs — single place to tune bullet density and pacing.
 * Higher fireRate = fewer shots (seconds between bursts).
 */
window.ENEMY_BALANCE = {
  fighterFireRate: 2.65,
  tankFireRate: 3.35,
  /** Skip this fraction of aimed shots (0–1) to thin the screen. */
  fireSkipChance: 0.18,
  maxShootersPerTick: 4,
  bulletSpeedBase: 165,
  bulletSpeedWave: 1.5,
  bulletSpeedCap: 205,
  boss: {
    phase1: { bullets: 5, interval: 1.12 },
    phase2: { arms: 7, interval: 0.58, extraAimed: false },
  },
};
