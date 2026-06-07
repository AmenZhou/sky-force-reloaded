/**
 * Log-driven issue detection for web-game-agent-analyze.
 * Returns tagged issues with evidence strings from JSONL records.
 */

function flatRunStarsTicks(ticks, minFlat = 10) {
  let best = null;
  for (let i = 0; i <= ticks.length - minFlat; i += 1) {
    const slice = ticks.slice(i, i + minFlat);
    const stars = slice.map((t) => t.runStars ?? 0);
    const min = Math.min(...stars);
    const max = Math.max(...stars);
    if (max - min <= 1 && (slice[slice.length - 1].enemyBullets || 0) > 0) {
      best = { startTurn: slice[0].turn, endTurn: slice[slice.length - 1].turn, runStars: min };
      break;
    }
  }
  return best;
}

function sectionStallTicks(ticks, minStall = 25) {
  let best = null;
  for (let i = 0; i <= ticks.length - minStall; i += 1) {
    const slice = ticks.slice(i, i + minStall);
    const section = slice[0].section ?? slice[0].wave;
    if (slice.every((t) => (t.section ?? t.wave) === section)) {
      best = { section, startTurn: slice[0].turn, endTurn: slice[slice.length - 1].turn };
      break;
    }
  }
  return best;
}

function scoreUpStarsFlat(ticks) {
  if (ticks.length < 8) return null;
  const first = ticks[0];
  const last = ticks[ticks.length - 1];
  const scoreDelta = (last.score ?? 0) - (first.score ?? 0);
  const starsDelta = (last.runStars ?? 0) - (first.runStars ?? 0);
  if (scoreDelta > 500 && starsDelta <= 2) {
    return { scoreDelta, starsDelta, startTurn: first.turn, endTurn: last.turn };
  }
  return null;
}

function actionSpam(actions) {
  if (!actions.length) return null;
  const dist = {};
  for (const a of actions) dist[a] = (dist[a] || 0) + 1;
  const waitPct = (dist.wait || 0) / actions.length;
  if (waitPct > 0.3) {
    return { kind: 'wait_spam', pct: Math.round(waitPct * 100) };
  }
  let streak = 1;
  let maxStreak = 1;
  let maxAction = actions[0];
  for (let i = 1; i < actions.length; i += 1) {
    if (actions[i] === actions[i - 1]) {
      streak += 1;
      if (streak > maxStreak) {
        maxStreak = streak;
        maxAction = actions[i];
      }
    } else streak = 1;
  }
  if (maxStreak > 20) return { kind: 'stuck', action: maxAction, streak: maxStreak };
  if (maxStreak > 5) return { kind: 'repeat', action: maxAction, streak: maxStreak };
  return null;
}

export function detectIssues(records, profile = 'sky-force-reloaded') {
  const issues = [];
  const start = records.find((r) => r.type === 'session_start');
  const end = records.find((r) => r.type === 'session_end');
  const ticks = records.filter((r) => r.type === 'tick');
  const events = records.filter((r) => r.type === 'event');
  const actions = records.filter((r) => r.type === 'action').map((r) => r.action);
  const errors = records.filter((r) => r.type === 'page_error' || r.type === 'console_error');

  for (const e of errors) {
    issues.push({
      tag: 'BUG',
      summary: `Runtime error: ${e.message || e.text || 'unknown'}`,
      evidence: `${e.type} turn=${e.turn ?? '?'}`,
      autoFix: true,
    });
  }

  if (!end) {
    issues.push({
      tag: 'BUG',
      summary: 'Missing session_end — agent crashed or was killed mid-run',
      evidence: `ticks=${ticks.length}`,
      autoFix: false,
    });
  }

  if (profile === 'sky-force-reloaded' || profile === 'sky-force') {
    const flat = flatRunStarsTicks(ticks);
    if (flat && start?.gameMode?.startsWith('stage')) {
      issues.push({
        tag: 'ECON',
        summary: `runStars flat for ${flat.endTurn - flat.startTurn + 1} ticks while combat active`,
        evidence: `turns ${flat.startTurn}-${flat.endTurn}, runStars=${flat.runStars}`,
        autoFix: false,
      });
    }

    const stall = sectionStallTicks(ticks);
    if (stall) {
      issues.push({
        tag: 'FUN',
        summary: `Section ${stall.section} stalled for ${stall.endTurn - stall.startTurn + 1} ticks`,
        evidence: `turns ${stall.startTurn}-${stall.endTurn}`,
        autoFix: false,
      });
    }

    const econ = scoreUpStarsFlat(ticks);
    if (econ) {
      issues.push({
        tag: 'ECON',
        summary: `Score +${econ.scoreDelta} but runStars +${econ.starsDelta} only`,
        evidence: `turns ${econ.startTurn}-${econ.endTurn}`,
        autoFix: false,
      });
    }

    if (end && start?.gameMode?.startsWith('stage') && !end.stageCleared && (end.bossTicks ?? 0) === 0) {
      issues.push({
        tag: 'AGENT',
        summary: 'Never reached boss in stage mode',
        evidence: `finalWave=${end.finalWave}, score=${end.finalScore}`,
        autoFix: true,
      });
    }

    if (end && start?.gameMode?.startsWith('stage') && !end.stageCleared && end.finalScore > 5000) {
      issues.push({
        tag: 'BALANCE',
        summary: 'High score but stage not cleared — difficulty or agent strategy gap',
        evidence: `score=${end.finalScore}, sections=${end.sectionsReached}`,
        autoFix: false,
      });
    }

    const death = events.find((e) => e.event === 'death') || (end?.deathCause ? { turn: end.turns, cause: end.deathCause } : null);
    if (death) {
      issues.push({
        tag: 'AGENT',
        summary: `Death at turn ${death.turn}${death.cause ? ` (${death.cause})` : ''}`,
        evidence: death.section ? `section=${death.section}, banner=${death.banner || '?'}` : undefined,
        autoFix: true,
      });
    }

    if (end && (end.hitsTaken ?? 0) > 15) {
      issues.push({
        tag: 'AGENT',
        summary: `Too many hits (${end.hitsTaken}) — dodge thresholds may be too aggressive`,
        evidence: `hits/${end.turns} turns`,
        autoFix: true,
      });
    }
  }

  const spam = actionSpam(actions);
  if (spam?.kind === 'stuck') {
    issues.push({
      tag: 'AGENT',
      summary: `Stuck repeating "${spam.action}" for ${spam.streak} turns`,
      evidence: `action=${spam.action}`,
      autoFix: true,
    });
  } else if (spam?.kind === 'wait_spam') {
    issues.push({
      tag: 'AGENT',
      summary: `wait action ${spam.pct}% of turns`,
      evidence: 'heuristic returning wait too often',
      autoFix: true,
    });
  }

  if (end && !end.stageCleared && (end.finalRunStars ?? 0) === 0 && start?.gameMode?.startsWith('stage')) {
    issues.push({
      tag: 'UX',
      summary: 'Zero runStars at end — player may not understand how to earn bankable stars',
      evidence: 'HUD may need clearer run ★ vs bank ★ distinction',
      autoFix: false,
    });
  }

  return issues;
}

export function issuesForBacklog(issues) {
  return issues.filter((i) => ['UX', 'FUN', 'ECON', 'RESEARCH', 'BALANCE'].includes(i.tag) && !i.autoFix);
}

export function issuesForAutoFix(issues) {
  return issues.filter((i) => i.autoFix && ['BUG', 'AGENT'].includes(i.tag));
}
