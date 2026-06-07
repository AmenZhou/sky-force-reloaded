# Sky Force — AI Agent

Playwright agent for balance testing, structured log analysis, and self-improving heuristics with cross-session memory.

## Quick start

```bash
cd ai-agent
npm install
npx playwright install chromium

# Stage 2 pilot (default improve-loop scenario)
node agent.js --heuristic --headless --stage --stage-id 2 --turns 200 --tick 350

# Analyze latest log → markdown report
node analyze-report.js

# Analyze + append UX/FUN items to backlog.md
node analyze-report.js --write

# Update memory (metrics-history + playbook) after a run
node agent.js --heuristic --headless --stage --stage-id 2 --turns 80 --update-memory

# Extended self-improve loop (run → analyze → tune → memory → backlog)
node improve-loop.js --headless --generations 3

# Legacy narrow loop (config tune only)
node improve.js --headless --generations 3 --turns 60 --tick 500
```

## Architecture

| File | Role |
|------|------|
| `agent.js` | Playwright loop — rich JSONL (`tick`, `event`, `session_end`) |
| `analyze-report.js` | Full tagged analysis report (`[BUG]` `[UX]` `[FUN]` …) |
| `improve-loop.js` | Multi-gen run → analyze → tune → memory → backlog |
| `memory/playbook.md` | Durable tactics (human + agent readable) |
| `memory/stage-notes.json` | Per-stage hints fed to heuristic |
| `memory/metrics-history.jsonl` | One compressed metrics line per run |
| `memory/update-from-log.js` | Append metrics + merge playbook deltas |
| `research/sky-force-reloaded.md` | Reference brief for UX/fun backlog |
| `backlog.md` | UX / FUN / ECON / RESEARCH proposals (not auto-fixed) |
| `agent-config.json` | Tunable heuristic thresholds + targets |
| `lib/issue-tags.js` | Log → tagged issues |
| `lib/analyze-report.js` | Report builder |
| `lib/heuristic.js` | Rule-based move picker (+ stage hints) |
| `tune.js` | Metric → config patch |
| `logs/run-*.jsonl` | Session recordings |

## JSONL schema (v2)

| Type | Purpose |
|------|---------|
| `session_start` | `profile`, `stageId`, `playbookVersion`, `configGeneration` |
| `tick` | `runStars`, `section`, `stageName`, `lastBanner`, `hostages*` |
| `event` | `section_banner`, `death`, `boss_spawn`, `stage_clear`, `game_over`, `star_milestone` |
| `action` | Heuristic/LLM move |
| `session_end` | `stageCleared`, `finalRunStars`, `sectionsReached`, `deathCause` |
| `page_error` / `console_error` | Runtime failures |

## Autonomy defaults

| Tag | Default action |
|-----|----------------|
| `[BUG]`, `[AGENT]` | Auto-fix in skill Phase 3 |
| `[UX]`, `[FUN]`, `[ECON]`, `[RESEARCH]` | Append to `backlog.md` |
| Heuristic tune | Auto via `tune.js` / `improve-loop.js` |
| Memory | Auto via `--update-memory` or improve-loop |

## Targets (`agent-config.json`)

```json
"targets": {
  "sectionsReached": 3,
  "minRunStars": 40,
  "maxHits": 12,
  "minScore": 5000,
  "stageClear": false
}
```

Set `"stageClear": true` when the agent reliably reaches the boss.

See `IMPROVEMENT-PLAN.md` for the full v3 roadmap.
