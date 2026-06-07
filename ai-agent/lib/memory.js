import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MEMORY_DIR = path.resolve(__dirname, '../memory');
export const PLAYBOOK_PATH = path.join(MEMORY_DIR, 'playbook.md');
export const METRICS_PATH = path.join(MEMORY_DIR, 'metrics-history.jsonl');
export const STAGE_NOTES_PATH = path.join(MEMORY_DIR, 'stage-notes.json');
export const BACKLOG_PATH = path.resolve(__dirname, '../backlog.md');

const DEFAULT_PLAYBOOK = `# Agent Playbook — Sky Force Reloaded

## Controls & lane
- Player flies in the **cloud lane** (upper third of screen); enemies and bosses sit on the ground below.
- Ship auto-fires downward — stay in lane and dodge upward ground fire.
- Pickups spawn in the flight lane; stars bank only after **stage clear** (not arcade).

## Per-stage priorities
- **Stage 1:** Learn dodge rhythm; rescue hostages when safe.
- **Stage 2 (BOMBARDMENT):** Kill ground units, hit **fuel depots** (~section 3), rescue hostages, then Dreadnought boss.
- **Stage 3+:** Prioritize destructibles and boss telegraphs over greedy pickup chases.

## Known failure modes
- runStars flat while score rises → economy or agent ignoring kills (check runStars in tick log).
- Stuck on same section >25 ticks → pacing stall or agent not engaging ground targets.
- Death in boss phase → stay centered in lane; dodge vertical salvos first.

## Heuristic overrides
- When \`bossActive\`, anchor to lane center and dodge bullets — ignore weapon pickups.
- When \`runStars\` flat for 10+ ticks in stage mode, favor aggressive center positioning over wide sweeps.

## Do not repeat
- Chasing pickups through bullet hell.
- Holding one direction >5 consecutive turns without dodge reason.
`;

const DEFAULT_STAGE_NOTES = {
  version: 1,
  stages: {
    '1': { name: 'Desert Storm', tips: ['Rescue hostages between waves', 'Boss: stay center, dodge horizontal spread'] },
    '2': {
      name: 'Fleet Assault',
      tips: [
        'BOMBARDMENT section: destroy fuel depots for run ★',
        'Ground turrets fire upward — dodge vertically in lane',
        'Boss Dreadnought: wide lane, prioritize vertical dodges',
      ],
      sectionHints: { '3': 'Fuel depot timing — engage destructibles' },
    },
    '3': { name: 'Iron Valley', tips: ['Bunker targets on ground', 'Section pacing tighter than stage 2'] },
    '4': { name: 'Black Coast', tips: ['Siege platform boss — longer bullet patterns'] },
    '5': { name: 'Skyfall Ridge', tips: ['Leviathan finale — conserve lives early'] },
  },
};

export function ensureMemoryDir() {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

export function loadPlaybook() {
  ensureMemoryDir();
  if (!fs.existsSync(PLAYBOOK_PATH)) {
    fs.writeFileSync(PLAYBOOK_PATH, DEFAULT_PLAYBOOK);
  }
  return fs.readFileSync(PLAYBOOK_PATH, 'utf8');
}

export function playbookVersion() {
  const text = loadPlaybook();
  const m = text.match(/^version:\s*(\d+)/m);
  return m ? parseInt(m[1], 10) : 1;
}

export function loadStageNotes() {
  ensureMemoryDir();
  if (!fs.existsSync(STAGE_NOTES_PATH)) {
    fs.writeFileSync(STAGE_NOTES_PATH, `${JSON.stringify(DEFAULT_STAGE_NOTES, null, 2)}\n`);
  }
  return JSON.parse(fs.readFileSync(STAGE_NOTES_PATH, 'utf8'));
}

export function getStageHints(stageId) {
  const notes = loadStageNotes();
  const key = String(stageId || '1');
  return notes.stages?.[key] || null;
}

export function appendMetrics(record) {
  ensureMemoryDir();
  fs.appendFileSync(METRICS_PATH, `${JSON.stringify(record)}\n`);
}

export function readMetricsHistory(limit = 50) {
  ensureMemoryDir();
  if (!fs.existsSync(METRICS_PATH)) return [];
  const lines = fs.readFileSync(METRICS_PATH, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map((l) => JSON.parse(l));
}

export function mergePlaybookDelta(lines) {
  if (!lines.length) return;
  const existing = loadPlaybook();
  const block = ['', '## Auto-learned (from logs)', ...lines.map((l) => `- ${l}`)].join('\n');
  if (existing.includes('## Auto-learned (from logs)')) {
    const updated = `${existing.trim()}\n${lines.map((l) => `- ${l}`).join('\n')}\n`;
    fs.writeFileSync(PLAYBOOK_PATH, updated);
  } else {
    fs.writeFileSync(PLAYBOOK_PATH, `${existing.trim()}${block}\n`);
  }
}

export function appendBacklogItems(items) {
  if (!items.length) return;
  ensureMemoryDir();
  const header = '# Agent backlog — UX / Fun / Research\n\n';
  if (!fs.existsSync(BACKLOG_PATH)) {
    fs.writeFileSync(BACKLOG_PATH, header);
  }
  const stamp = new Date().toISOString().slice(0, 19);
  const block = items.map((i) => `- [ ] **${i.tag}** ${i.summary}${i.evidence ? ` — _${i.evidence}_` : ''}`).join('\n');
  fs.appendFileSync(BACKLOG_PATH, `\n## ${stamp}\n${block}\n`);
}
