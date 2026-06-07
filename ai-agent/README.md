# Sky Force — AI Agent

Playwright agent for balance testing and self-improving heuristics.

## Quick start

```bash
cd ai-agent
npm install
npx playwright install chromium

# Heuristic bot (uses agent-config.json)
node agent.js --heuristic --headless --turns 80 --tick 500

# Auto-tune after run
node agent.js --heuristic --headless --turns 80 --tune-after

# Self-improve loop (run → tune → run → …)
node improve.js --headless --generations 3 --turns 60 --tick 500

# LLM player (needs OPENAI_API_KEY or ANTHROPIC_API_KEY)
node agent.js --model openai --headless --turns 25 --tick 800
node agent.js --model claude --headless --turns 25 --tick 800
```

## Architecture

| File | Role |
|------|------|
| `agent.js` | Playwright loop — heuristic or LLM mode |
| `agent-config.json` | Tunable heuristic thresholds |
| `tune.js` | Reads latest JSONL log, adjusts config |
| `improve.js` | Multi-generation run → tune loop |
| `analyze-logs.js` | Human-readable log summary |
| `lib/heuristic.js` | Rule-based `pickMove` |
| `lib/llm.js` | OpenAI / Claude move picker |
| `lib/tuner.js` | Metric → config patch logic |
| `logs/run-*.jsonl` | Session recordings |

## Self-improvement

**Heuristic path (automated):**

1. Agent plays using `agent-config.json`
2. `tune.js` compares `session_end` metrics to targets
3. Adjusts dodge ranges, pickup seek, bullet-hell threshold
4. `improve.js` repeats until targets met or generations exhausted

**LLM path (adaptive per turn):**

- Sends compact `getState()` snapshot each turn
- Model picks dodge direction without code changes
- Does not auto-tune config — use for strategy experiments

## Targets (edit in agent-config.json)

```json
"targets": {
  "minWave": 3,
  "maxHitsPer80Turns": 12,
  "minScore": 8000
}
```
