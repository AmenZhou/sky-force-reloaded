const VALID_ACTIONS = new Set([
  'move_left', 'move_right', 'move_up', 'move_down', 'wait', 'hold_slowmo',
]);

export { VALID_ACTIONS };

function laneAnchors(state, cfg) {
  const lane = state.flightLane;
  if (lane) {
    return {
      anchorX: state.canvasW ? state.canvasW / 2 : cfg.safeAnchorX,
      anchorY: lane.center,
      yMin: lane.top + 8,
      yMax: lane.bottom - 8,
    };
  }
  return {
    anchorX: cfg.safeAnchorX,
    anchorY: cfg.safeAnchorY,
    yMin: cfg.safeZoneYMin ?? cfg.safeAnchorY - 60,
    yMax: cfg.safeZoneYMax,
  };
}

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

function weightedBulletDodge(state, cfg) {
  const scores = { left: 0, right: 0, up: 0, down: 0 };
  const yBottom = cfg.threatAheadYBottom ?? 220;
  const yTop = cfg.threatAheadYTop ?? 80;
  for (const b of state.enemyBullets || []) {
    if (Math.abs(b.vx) < 20 && Math.abs(b.vy) < 20) continue;
    const dx = b.x - state.playerX;
    const dy = b.y - state.playerY;
    if (Math.abs(dx) > cfg.threatNearX + 30) continue;
    if (dy > yBottom || dy < -yTop) continue;

    const toward = b.vx * dx + b.vy * dy;
    if (toward > 0) continue;

    const w = 1 / (Math.abs(dx) + Math.abs(dy) * 0.25 + 10);
    if (dx <= 0) scores.right += w;
    else scores.left += w;
    if (b.vy > 30) scores.down += w * 0.65;
    else if (b.vy < -30) scores.up += w * 0.65;
    else if (dy > 0) scores.up += w * 0.45;
    else scores.down += w * 0.45;
  }
  let best = null;
  let bestScore = 0.08;
  for (const [dir, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = dir;
    }
  }
  if (!best) return null;
  return `move_${best}`;
}

function nearestEnemyThreat(state) {
  let worst = null;
  let worstGap = Infinity;
  const targets = [...(state.enemies || [])];
  if (state.boss) targets.push({ ...state.boss, type: 'boss' });
  for (const e of targets) {
    const dx = e.x - state.playerX;
    const dy = e.y - state.playerY;
    const margin = e.type === 'boss' ? 70 : e.type === 'tank' || e.type === 'turret' ? 120 : 90;
    if (dy < -margin || dy > margin) continue;
    const gap = Math.hypot(dx, dy) - (e.radius || 14);
    if (gap < worstGap) {
      worstGap = gap;
      worst = { dx, gap };
    }
  }
  const threshold = state.boss ? 65 : 50;
  return worst && worst.gap < threshold ? worst : null;
}

function avoidRepeat(action, lastAction, streak, turn) {
  if (streak < 3 || action !== lastAction) return action;
  const cycle = ['move_left', 'move_right', 'move_up', 'move_down'];
  const alts = cycle.filter((a) => a !== lastAction);
  return alts[turn % alts.length];
}

export function pickHeuristicMove(state, turn, cfg, context = {}) {
  const { lastAction = null, sameActionStreak = 0, stageHints = null } = context;
  if (!state?.running) return 'wait';
  if (state.timeScale < 1) return 'hold_slowmo';

  const lane = laneAnchors(state, cfg);
  const bullets = state.enemyBullets || [];
  const section = state.section ?? state.wave;
  const weaponRange = section >= 2
    ? cfg.weaponPickupRange + 40
    : cfg.weaponPickupRange;

  const sectionHint = stageHints?.sectionHints?.[String(section)];
  const preferCenter = sectionHint || (stageHints?.tips?.some((t) => /fuel depot|bombardment/i.test(t)) && section >= 3);

  if (bullets.length > cfg.bulletHellThreshold || state.boss) {
    let action;
    if (state.playerX > cfg.safeZoneXMax) action = 'move_left';
    else if (state.playerX < cfg.safeZoneXMin) action = 'move_right';
    else if (state.playerY > lane.yMax) action = 'move_up';
    else if (state.playerY < lane.yMin) action = 'move_down';
    else if (preferCenter && state.boss) {
      action = moveToward(state.playerX, state.playerY, lane.anchorX, lane.anchorY);
    } else action = moveToward(state.playerX, state.playerY, lane.anchorX, lane.anchorY);
    return avoidRepeat(action, lastAction, sameActionStreak, turn);
  }

  const enemyThreat = nearestEnemyThreat(state);
  if (enemyThreat) {
    const action = enemyThreat.dx > 0 ? 'move_left' : 'move_right';
    return avoidRepeat(action, lastAction, sameActionStreak, turn);
  }

  if (preferCenter && !state.boss && bullets.length < cfg.bulletHellThreshold / 2) {
    const action = moveToward(state.playerX, state.playerY, lane.anchorX, lane.anchorY);
    return avoidRepeat(action, lastAction, sameActionStreak, turn);
  }

  const dodge = weightedBulletDodge(state, cfg);
  if (dodge) {
    return avoidRepeat(dodge, lastAction, sameActionStreak, turn);
  }

  if (state.shieldPct < cfg.shieldSeekPct) {
    const shield = nearestPickup(state, 'shield');
    if (shield && Math.hypot(shield.x - state.playerX, shield.y - state.playerY) < cfg.shieldPickupRange) {
      return moveToward(state.playerX, state.playerY, shield.x, shield.y);
    }
  }

  if (state.weaponLevel < cfg.weaponSeekLevel) {
    const weapon = nearestPickup(state, 'weapon');
    if (weapon && Math.hypot(weapon.x - state.playerX, weapon.y - state.playerY) < weaponRange) {
      return moveToward(state.playerX, state.playerY, weapon.x, weapon.y);
    }
  }

  if (state.shieldPct < cfg.panicShieldPct) {
    const action = turn % 2 === 0 ? 'move_left' : 'move_right';
    return avoidRepeat(action, lastAction, sameActionStreak, turn);
  }

  const cycle = ['move_left', 'move_right', 'move_up', 'move_down'];
  const action = cycle[turn % cycle.length];
  return avoidRepeat(action, lastAction, sameActionStreak, turn);
}
