function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function tuneFromMetrics(cfg, metrics) {
  const next = { ...cfg, targets: { ...cfg.targets } };
  const notes = [];
  const t = cfg.targets;
  const hitRate = metrics.hitsTaken / Math.max(1, metrics.turns);

  if (metrics.hitsTaken > t.maxHitsPer80Turns || hitRate > 0.15) {
    next.bulletHellThreshold = clamp(next.bulletHellThreshold - 1, 6, 20);
    next.shieldSeekPct = clamp(next.shieldSeekPct + 5, 40, 80);
    next.shieldPickupRange = clamp(next.shieldPickupRange + 15, 80, 220);
    next.threatNearX = clamp(next.threatNearX + 5, 40, 120);
    notes.push('too many hits → dodge earlier, seek shield more');
  }

  if (metrics.finalWave < t.minWave) {
    next.weaponPickupRange = clamp(next.weaponPickupRange + 20, 80, 220);
    next.weaponSeekLevel = clamp(next.weaponSeekLevel + 1, 2, 4);
    next.bulletHellThreshold = clamp(next.bulletHellThreshold + 1, 6, 20);
    notes.push('low wave → seek weapons, play more aggressive');
  }

  if (metrics.finalScore < t.minScore && metrics.hitsTaken <= t.maxHitsPer80Turns) {
    next.weaponPickupRange = clamp(next.weaponPickupRange + 10, 80, 220);
    next.safeAnchorY = clamp(next.safeAnchorY - 10, 480, 580);
    notes.push('low score but safe → push forward for kills');
  }

  if (metrics.maxBullets > 18 && metrics.hitsTaken > t.maxHitsPer80Turns) {
    next.safeZoneXMin = clamp(next.safeZoneXMin - 5, 120, 180);
    next.safeZoneXMax = clamp(next.safeZoneXMax + 5, 180, 240);
    notes.push('bullet hell → widen safe lane');
  }

  if (notes.length === 0) {
    notes.push('targets met — minor exploration bump');
    next.threatNearX = clamp(next.threatNearX + 1, 40, 120);
  }

  next.tuningGeneration = (cfg.tuningGeneration || 0) + 1;
  next.lastTunedFrom = pathBasename(metrics.logPath);
  return { next, notes };
}

function pathBasename(p) {
  return p.split(/[/\\]/).pop();
}
