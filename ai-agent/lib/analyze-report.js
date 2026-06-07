import fs from 'fs';
import { detectIssues, issuesForBacklog } from './issue-tags.js';
import { parseLogExtended } from './parse-log.js';

function actionDistribution(records) {
  const actions = records.filter((r) => r.type === 'action').map((r) => r.action);
  const dist = {};
  for (const a of actions) dist[a] = (dist[a] || 0) + 1;
  const total = actions.length || 1;
  return Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .map(([action, count]) => ({ action, count, pct: Math.round((count / total) * 100) }));
}

function formatDistTable(dist) {
  if (!dist.length) return '_No actions recorded._\n';
  const rows = dist.map((d) => `| ${d.action} | ${d.count} | ${d.pct}% |`).join('\n');
  return `| Action | Count | % |\n|--------|-------|---|\n${rows}\n`;
}

export function analyzeLog(logPath, options = {}) {
  const profile = options.profile || 'sky-force-reloaded';
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  const records = lines.map((l) => JSON.parse(l));
  const metrics = parseLogExtended(logPath, records);
  const issues = detectIssues(records, profile);
  const dist = actionDistribution(records);
  const errors = records.filter((r) => r.type === 'page_error' || r.type === 'console_error');

  return {
    logPath,
    profile,
    metrics,
    issues,
    dist,
    errors,
    hasSessionEnd: !!records.find((r) => r.type === 'session_end'),
    markdown: buildMarkdown(logPath, profile, metrics, issues, dist, errors, records),
    backlogItems: issuesForBacklog(issues),
  };
}

function buildMarkdown(logPath, profile, metrics, issues, dist, errors, records) {
  const base = logPath.split(/[/\\]/).pop();
  const start = records.find((r) => r.type === 'session_start');
  const lines = [
    `## Agent Session Analysis — ${base}`,
    `**Profile:** ${profile} | **Turns:** ${metrics.turns} | **session_end:** ${metrics.hasSessionEnd ? 'yes' : 'no'}`,
    '',
    '### Outcome',
    `- Mode: ${metrics.mode} | Game: ${start?.gameMode ?? '?'}`,
    `- Score: ${metrics.finalScore} | Run ★: ${metrics.finalRunStars ?? 0} | Section: ${metrics.finalWave}`,
    `- Lives: ${metrics.finalLives} | Hits: ${metrics.hitsTaken} | Boss ticks: ${metrics.bossTicks ?? 0}`,
    `- Stage cleared: ${metrics.stageCleared ? 'yes' : 'no'} | Sections reached: ${metrics.sectionsReached ?? '?'}`,
    '',
    '### Action Distribution',
    formatDistTable(dist),
    '',
    '### Errors',
    errors.length
      ? errors.map((e) => `- \`${e.type}\`: ${e.message || e.text}`).join('\n')
      : '_None_',
    '',
    '### Issues Found',
  ];

  if (!issues.length) lines.push('_No issues detected from log rules._');
  else {
    for (const i of issues) {
      lines.push(`- [${i.tag}] ${i.summary}${i.evidence ? ` — ${i.evidence}` : ''}`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

export function writeReport(logPath, outPath, options = {}) {
  const report = analyzeLog(logPath, options);
  fs.writeFileSync(outPath, report.markdown);
  return report;
}
