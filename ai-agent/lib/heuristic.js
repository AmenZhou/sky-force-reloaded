const VALID_ACTIONS = new Set([
  'move_left', 'move_right', 'move_up', 'move_down', 'wait', 'hold_slowmo',
]);

export { VALID_ACTIONS };

function nearestPickup(state, type) {
  let best = null;
  let bestDist = Infinity;
  for (const p of state.powerups || []) {
    if (type && p.type !== type) continue;
    const d = Math.hypot(p.x - state.playerX, p.y - state.playerY);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

function moveToward(px, py, tx, ty) {
  const dx = tx - px;
  const dy = ty - py;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'move_right' : 'move_left';
  }
  return dy > 0 ? 'move_down' : 'move_up';
}

function bulletThreat(state, cfg) {
  let left = 0;
  let right = 0;
  let up = 0;
  let down = 0;
  for (const b of state.enemyBullets || []) {
    if (b.vy <= 0) continue;
    const ahead = b.y > state.playerY - cfg.threatAheadYTop
      && b.y < state.playerY + cfg.threatAheadYBottom;
    if (!ahead) continue;
    if (Math.abs(b.x - state.playerX) >= cfg.threatNearX) continue;
    if (b.x < state.playerX) left += 1;
    else right += 1;
    if (b.y < state.playerY) up += 1;
    else down += 1;
  }
  return { left, right, up, down };
}

export function pickHeuristicMove(state, turn, cfg) {
  if (!state?.running) return 'wait';
  if (state.timeScale < 1) return 'hold_slowmo';

  const bullets = state.enemyBullets || [];
  const threat = bulletThreat(state, cfg);

  if (bullets.length > cfg.bulletHellThreshold) {
    if (state.playerX > cfg.safeZoneXMax) return 'move_left';
    if (state.playerX < cfg.safeZoneXMin) return 'move_right';
    if (state.playerY > cfg.safeZoneYMax) return 'move_up';
    return moveToward(state.playerX, state.playerY, cfg.safeAnchorX, cfg.safeAnchorY);
  }

  if (state.shieldPct < cfg.shieldSeekPct) {
    const shield = nearestPickup(state, 'shield');
    if (shield && Math.hypot(shield.x - state.playerX, shield.y - state.playerY) < cfg.shieldPickupRange) {
      return moveToward(state.playerX, state.playerY, shield.x, shield.y);
    }
  }

  if (state.weaponLevel < cfg.weaponSeekLevel) {
    const weapon = nearestPickup(state, 'weapon');
    if (weapon && Math.hypot(weapon.x - state.playerX, weapon.y - state.playerY) < cfg.weaponPickupRange) {
      return moveToward(state.playerX, state.playerY, weapon.x, weapon.y);
    }
  }

  if (threat.left + threat.right > 0) {
    if (threat.left > threat.right) return 'move_right';
    if (threat.right > threat.left) return 'move_left';
    if (threat.up > threat.down) return 'move_down';
    return 'move_up';
  }

  if (state.shieldPct < cfg.panicShieldPct) {
    return turn % 2 === 0 ? 'move_left' : 'move_right';
  }

  const cycle = ['move_left', 'move_right', 'move_up', 'move_down'];
  return cycle[turn % cycle.length];
}
