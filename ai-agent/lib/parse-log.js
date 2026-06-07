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

export function parseLog(logPath) {
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  const records = lines.map((l) => JSON.parse(l));
  const end = records.find((r) => r.type === 'session_end');
  if (!end) throw new Error(`No session_end in ${logPath}`);
  const ticks = records.filter((r) => r.type === 'tick');
  const maxBullets = ticks.reduce((m, t) => Math.max(m, t.enemyBullets || 0), 0);
  return {
    logPath,
    mode: records.find((r) => r.type === 'session_start')?.mode || 'heuristic',
    finalScore: end.finalScore ?? 0,
    finalWave: end.finalWave ?? 0,
    finalLives: end.finalLives ?? 0,
    hitsTaken: end.hitsTaken ?? 0,
    turns: end.turns ?? ticks.length,
    maxBullets,
    slowMoTicks: end.slowMoTicks ?? 0,
  };
}

export function summarizeLog(logPath) {
  const m = parseLog(logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  const actions = lines.filter((l) => JSON.parse(l).type === 'action').map((l) => JSON.parse(l).action);
  const dist = {};
  for (const a of actions) dist[a] = (dist[a] || 0) + 1;
  return { ...m, actionDistribution: dist };
}
