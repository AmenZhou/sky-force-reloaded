#!/usr/bin/env node
/**
 * Append run metrics + merge playbook deltas from a JSONL log.
 * Usage: node memory/update-from-log.js --log path/to/run.jsonl
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeLog } from '../lib/analyze-report.js';
import {
  appendMetrics,
  mergePlaybookDelta,
  appendBacklogItems,
  getStageHints,
} from '../lib/memory.js';
import { findLatestLog } from '../lib/parse-log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const logIdx = args.indexOf('--log');
const logPath = logIdx >= 0 ? path.resolve(args[logIdx + 1]) : findLatestLog();
const writeBacklog = args.includes('--backlog');

const report = analyzeLog(logPath);
const m = report.metrics;
const start = report.metrics.sessionStart || {};

const record = {
  ts: new Date().toISOString(),
  log: path.basename(logPath),
  profile: report.profile,
  gameMode: start.gameMode,
  stageId: start.stageId ?? null,
  turns: m.turns,
  finalScore: m.finalScore,
  finalRunStars: m.finalRunStars ?? 0,
  finalWave: m.finalWave,
  sectionsReached: m.sectionsReached ?? m.finalWave,
  hitsTaken: m.hitsTaken,
  bossTicks: m.bossTicks ?? 0,
  stageCleared: !!m.stageCleared,
  configGeneration: start.configGeneration ?? null,
  playbookVersion: start.playbookVersion ?? null,
  issueCounts: report.issues.reduce((acc, i) => {
    acc[i.tag] = (acc[i.tag] || 0) + 1;
    return acc;
  }, {}),
};

appendMetrics(record);

const deltas = [];
for (const issue of report.issues) {
  if (issue.tag === 'AGENT' && issue.summary.includes('Death')) {
    deltas.push(issue.summary + (issue.evidence ? ` (${issue.evidence})` : ''));
  }
  if (issue.tag === 'ECON') {
    deltas.push(issue.summary);
  }
  if (issue.tag === 'FUN') {
    deltas.push(issue.summary);
  }
}
if (deltas.length) mergePlaybookDelta([...new Set(deltas)].slice(0, 5));

if (writeBacklog && report.backlogItems.length) {
  appendBacklogItems(report.backlogItems);
}

const stageId = start.stageId;
if (stageId) {
  const hints = getStageHints(stageId);
  if (hints?.tips?.length) {
    console.log(`Stage ${stageId} notes loaded (${hints.tips.length} tips)`);
  }
}

console.log('=== Memory Update ===');
console.log(`Log: ${logPath}`);
console.log(`Appended metrics: score=${record.finalScore} cleared=${record.stageCleared}`);
console.log(`Playbook deltas: ${deltas.length}`);
if (writeBacklog) console.log(`Backlog items: ${report.backlogItems.length}`);
