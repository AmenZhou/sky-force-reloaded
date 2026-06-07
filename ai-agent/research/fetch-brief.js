#!/usr/bin/env node
/**
 * Reference brief for profile — reads cached research markdown (no web required).
 * Usage: node research/fetch-brief.js [--profile sky-force-reloaded] [--topic UX]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const profileIdx = args.indexOf('--profile');
const topicIdx = args.indexOf('--topic');
const profile = profileIdx >= 0 ? args[profileIdx + 1] : 'sky-force-reloaded';
const topic = topicIdx >= 0 ? args[topicIdx + 1].toUpperCase() : null;

const briefPath = path.join(__dirname, `${profile}.md`);
if (!fs.existsSync(briefPath)) {
  console.error(`No brief at ${briefPath}`);
  process.exit(1);
}

const text = fs.readFileSync(briefPath, 'utf8');
if (!topic) {
  console.log(text);
  process.exit(0);
}

const sections = text.split(/^## /m).slice(1);
const hit = sections.find((s) => s.toUpperCase().includes(topic));
if (hit) {
  console.log(`## ${hit.trim()}`);
} else {
  console.log(`No section matching "${topic}" in ${briefPath}`);
  console.log('\n--- Full brief ---\n');
  console.log(text);
}
