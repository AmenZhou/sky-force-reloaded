#!/usr/bin/env node
/** Summarize a JSONL agent log. Usage: node analyze-logs.js [--log path] */
import path from 'path';
import { findLatestLog, summarizeLog } from './lib/parse-log.js';

const args = process.argv.slice(2);
const i = args.indexOf('--log');
const logPath = i >= 0 ? path.resolve(args[i + 1]) : findLatestLog();
const s = summarizeLog(logPath);

console.log('=== Agent Log Summary ===');
console.log(`Log: ${logPath}`);
console.log(`Mode: ${s.mode}`);
console.log(`Score: ${s.finalScore} | Wave: ${s.finalWave} | Lives: ${s.finalLives}`);
console.log(`Hits: ${s.hitsTaken}/${s.turns} | Max bullets on screen: ${s.maxBullets}`);
console.log('Actions:', s.actionDistribution);
