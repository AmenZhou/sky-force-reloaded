#!/usr/bin/env node
/**
 * Log-driven heuristic tuner — adjusts agent-config.json from JSONL results.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, saveConfig, CONFIG_PATH } from './lib/config.js';
import { findLatestLog, parseLog } from './lib/parse-log.js';
import { tuneFromMetrics } from './lib/tuner.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const logArgIdx = args.indexOf('--log');
const LOG_PATH = logArgIdx >= 0 ? path.resolve(args[logArgIdx + 1]) : findLatestLog();

const metrics = parseLog(LOG_PATH);
const cfg = loadConfig();
const { next, notes } = tuneFromMetrics(cfg, metrics);

console.log('=== Sky Force Agent Tuner ===');
console.log(`Log: ${metrics.logPath}`);
console.log(`Mode: ${metrics.mode} | Score: ${metrics.finalScore} | Wave: ${metrics.finalWave} | Hits: ${metrics.hitsTaken}/${metrics.turns}`);
console.log(`Targets: wave≥${cfg.targets.minWave}, hits≤${cfg.targets.maxHitsPer80Turns}, score≥${cfg.targets.minScore}`);
console.log('\nAdjustments:');
for (const n of notes) console.log(`  • ${n}`);

const skipKeys = new Set(['targets', 'lastTunedFrom', 'tuningGeneration', 'version']);
const changed = Object.keys(next).filter((k) => !skipKeys.has(k) && next[k] !== cfg[k]);
if (changed.length) {
  console.log('\nParam deltas:');
  for (const k of changed) console.log(`  ${k}: ${cfg[k]} → ${next[k]}`);
}

if (DRY_RUN) {
  console.log('\n[dry-run] Config not written.');
} else {
  saveConfig(next);
  console.log(`\n[written] ${CONFIG_PATH} (generation ${next.tuningGeneration})`);
}
