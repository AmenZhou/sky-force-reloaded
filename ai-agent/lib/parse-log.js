import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function findLatestLog(logsDir) {
  const dir = logsDir || path.resolve(__dirname, '../logs');
  if (!fs.existsSync(dir)) throw new Error('No logs/ directory — run agent.js first');
  const files = fs.readdirSync(dir)
    .filter((f) => f.startsWith('run-') && f.endsWith('.jsonl'))
    .map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (!files.length) throw new Error('No run-*.jsonl logs found');
  return path.join(dir, files[0].f);
}

export function readRecords(logPath) {
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

export function parseLog(logPath) {
  return parseLogExtended(logPath);
}

export function parseLogExtended(logPath, recordsIn) {
  const records = recordsIn || readRecords(logPath);
  const end = records.find((r) => r.type === 'session_end');
  if (!end) throw new Error(`No session_end in ${logPath}`);
  const start = records.find((r) => r.type === 'session_start');
  const ticks = records.filter((r) => r.type === 'tick');
  const maxBullets = ticks.reduce((m, t) => Math.max(m, t.enemyBullets || 0), 0);
  return {
    logPath,
    hasSessionEnd: true,
    sessionStart: start || null,
    mode: start?.mode || 'heuristic',
    profile: start?.profile || 'sky-force-reloaded',
    finalScore: end.finalScore ?? 0,
    finalWave: end.finalWave ?? 0,
    finalLives: end.finalLives ?? 0,
    finalRunStars: end.finalRunStars ?? end.runStars ?? ticks.at(-1)?.runStars ?? 0,
    hitsTaken: end.hitsTaken ?? 0,
    turns: end.turns ?? ticks.length,
    maxBullets,
    slowMoTicks: end.slowMoTicks ?? 0,
    bossTicks: end.bossTicks ?? 0,
    stageCleared: !!end.stageCleared,
    sectionsReached: end.sectionsReached ?? end.finalWave ?? 0,
    deathCause: end.deathCause ?? null,
    playDurationSec: end.playDurationSec ?? null,
  };
}

export function summarizeLog(logPath) {
  const m = parseLogExtended(logPath);
  const records = readRecords(logPath);
  const actions = records.filter((r) => r.type === 'action').map((r) => r.action);
  const dist = {};
  for (const a of actions) dist[a] = (dist[a] || 0) + 1;
  return { ...m, actionDistribution: dist };
}
