#!/usr/bin/env node
/**
 * Self-improve loop: run heuristic agent → tune config → repeat.
 * Usage: node improve.js --headless --generations 3 --turns 80 --tick 500
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './lib/config.js';
import { parseLog } from './lib/parse-log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawArgs = process.argv.slice(2);

function pullFlag(name) {
  const i = rawArgs.indexOf(name);
  if (i < 0) return { value: null, rest: rawArgs };
  const value = rawArgs[i + 1];
  const rest = rawArgs.filter((_, idx) => idx !== i && idx !== i + 1);
  return { value, rest };
}

const { value: genStr, rest: agentArgs } = pullFlag('--generations');
const GENERATIONS = parseInt(genStr || '3', 10);

function runAgent() {
  const res = spawnSync('node', ['agent.js', '--heuristic', ...agentArgs], {
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  process.stdout.write(res.stdout || '');
  process.stderr.write(res.stderr || '');
  if (res.status !== 0) throw new Error(`agent.js exited ${res.status}`);
  const match = (res.stdout || '').match(/\[log\] (.+\.jsonl)/);
  return match ? match[1].trim() : null;
}

function runTune(logPath) {
  const res = spawnSync('node', ['tune.js', '--log', logPath], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  if (res.status !== 0) throw new Error(`tune.js exited ${res.status}`);
}

function targetsMet(metrics, cfg) {
  return metrics.finalWave >= cfg.targets.minWave
    && metrics.hitsTaken <= cfg.targets.maxHitsPer80Turns
    && metrics.finalScore >= cfg.targets.minScore;
}

function main() {
  console.log(`=== Sky Force Self-Improve (${GENERATIONS} generations) ===\n`);
  const history = [];

  for (let gen = 1; gen <= GENERATIONS; gen += 1) {
    const cfg = loadConfig();
    console.log(`--- Generation ${gen} (config gen ${cfg.tuningGeneration}) ---`);

    const logPath = runAgent();
    if (!logPath || !fs.existsSync(logPath)) {
      throw new Error('Agent did not produce a log path');
    }

    const metrics = { ...parseLog(logPath), generation: gen };
    history.push(metrics);

    console.log(`Result: score=${metrics.finalScore} wave=${metrics.finalWave} hits=${metrics.hitsTaken}\n`);

    if (targetsMet(metrics, cfg)) {
      console.log('Targets met — stopping early.');
      break;
    }

    if (gen < GENERATIONS) runTune(logPath);
  }

  console.log('\n=== History ===');
  for (const h of history) {
    console.log(`  gen ${h.generation}: score=${h.finalScore} wave=${h.finalWave} hits=${h.hitsTaken}`);
  }
}

main();
