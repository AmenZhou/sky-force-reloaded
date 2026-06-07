#!/usr/bin/env node
/**
 * Extended self-improve loop: run → analyze → tune → memory → backlog
 * Usage: node improve-loop.js --headless --generations 3 --turns 200 --tick 350 --stage --stage-id 2
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './lib/config.js';
import { parseLogExtended } from './lib/parse-log.js';
import { analyzeLog } from './lib/analyze-report.js';
import { appendBacklogItems } from './lib/memory.js';

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
const WRITE_BACKLOG = !rawArgs.includes('--no-backlog');
const SKIP_MEMORY = rawArgs.includes('--skip-memory');

const DEFAULT_AGENT_ARGS = ['--heuristic', '--stage', '--stage-id', '2', '--turns', '200', '--tick', '350', '--headless'];
const mergedAgentArgs = agentArgs.length ? agentArgs : DEFAULT_AGENT_ARGS;
if (!mergedAgentArgs.includes('--heuristic')) mergedAgentArgs.unshift('--heuristic');

function runAgent() {
  const res = spawnSync('node', ['agent.js', ...mergedAgentArgs], {
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

function runMemoryUpdate(logPath) {
  const res = spawnSync('node', ['memory/update-from-log.js', '--log', logPath, ...(WRITE_BACKLOG ? ['--backlog'] : [])], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  if (res.status !== 0) throw new Error(`update-from-log.js exited ${res.status}`);
}

function targetsMet(metrics, cfg) {
  const t = cfg.targets || {};
  if (t.stageClear && !metrics.stageCleared) return false;
  if (t.minRunStars != null && (metrics.finalRunStars ?? 0) < t.minRunStars) return false;
  if (t.sectionsReached != null && (metrics.sectionsReached ?? 0) < t.sectionsReached) return false;
  if (t.minWave != null && metrics.finalWave < t.minWave) return false;
  if (t.maxHits != null && metrics.hitsTaken > t.maxHits) return false;
  if (t.maxHitsPer80Turns != null && metrics.hitsTaken > t.maxHitsPer80Turns) return false;
  if (t.minScore != null && metrics.finalScore < t.minScore) return false;
  return true;
}

function main() {
  console.log(`=== Improve Loop (${GENERATIONS} generations) ===\n`);
  const history = [];

  for (let gen = 1; gen <= GENERATIONS; gen += 1) {
    const cfg = loadConfig();
    console.log(`--- Generation ${gen} (config gen ${cfg.tuningGeneration}) ---`);

    const logPath = runAgent();
    if (!logPath || !fs.existsSync(logPath)) {
      throw new Error('Agent did not produce a log path');
    }

    const report = analyzeLog(logPath);
    const metrics = { ...report.metrics, generation: gen };
    history.push(metrics);

    console.log('\n--- Analysis ---');
    console.log(report.markdown);

    if (WRITE_BACKLOG && report.backlogItems.length) {
      appendBacklogItems(report.backlogItems);
      console.log(`[backlog] ${report.backlogItems.length} UX/FUN/ECON items appended`);
    }

    if (!SKIP_MEMORY) runMemoryUpdate(logPath);

    console.log(`\nResult: score=${metrics.finalScore} runStars=${metrics.finalRunStars} cleared=${metrics.stageCleared} hits=${metrics.hitsTaken}\n`);

    if (targetsMet(metrics, cfg)) {
      console.log('Targets met — stopping early.');
      break;
    }

    if (gen < GENERATIONS) runTune(logPath);
  }

  console.log('\n=== History ===');
  for (const h of history) {
    console.log(`  gen ${h.generation}: score=${h.finalScore} runStars=${h.finalRunStars} cleared=${h.stageCleared} hits=${h.hitsTaken}`);
  }
}

main();
