#!/usr/bin/env node
/** Full analysis report from JSONL. Usage: node analyze-report.js [--log path] [--write backlog.md] [--out report.md] */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeLog } from './lib/analyze-report.js';
import { findLatestLog } from './lib/parse-log.js';
import { appendBacklogItems } from './lib/memory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const logIdx = args.indexOf('--log');
const outIdx = args.indexOf('--out');
const logPath = logIdx >= 0 ? path.resolve(args[logIdx + 1]) : findLatestLog();
const outPath = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : null;
const writeBacklog = args.includes('--write');

const report = analyzeLog(logPath);
console.log(report.markdown);

if (outPath) {
  fs.writeFileSync(outPath, report.markdown);
  console.error(`[written] ${outPath}`);
}

if (writeBacklog && report.backlogItems.length) {
  appendBacklogItems(report.backlogItems);
  console.error(`[backlog] ${report.backlogItems.length} items appended`);
}
