/**
 * Combat balance knobs — single place to tune bullet density and pacing.
 * Higher fireRate = fewer shots (seconds between bursts).
 */
window.ENEMY_BALANCE = {
  fighterFireRate: 9,
  tankFireRate: 5.2,
  turretFireRate: 4.8,
  /** Only ground batteries shoot in the new ground-war profile. */
  groundShootersOnly: true,
  fireSkipChance: 0.42,
  maxShootersPerTick: 2,
  bulletSpeedBase: 145,
  bulletSpeedWave: 0.9,
  bulletSpeedCap: 180,
  boss: {
    phase1: { bullets: 3, interval: 1.55 },
    phase2: { arms: 4, interval: 0.95, extraAimed: false },
  },
};
