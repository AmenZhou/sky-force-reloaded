# Changelog

## 0.1.1 — 2026-06-06

- Fix: switch from ES modules to classic scripts so the game runs via `file://` (double-click HTML)
- Fix: stop previous game loop on retry (prevent duplicate rAF loops)
- Fix: replace `roundRect` with `rect` for broader browser support

## 0.3.2 — 2026-06-07

- Agent: LLM mode (`--model claude|openai|openai-mini`), log-driven tuner, self-improve loop
- Agent: heuristic params externalized to `ai-agent/agent-config.json`

## 0.3.1 — 2026-06-07

- Fix: runStars now banks star entity value (÷10), not +1 per pickup
- Balance: wave-scaled enemy bullet damage/speed; hull ram 25→18
- Agent: bullet-aware dodge + pickup seeking; richer getState snapshot

## 0.3.0 — 2026-06-06

- UI: vivid cosmic HUD, hit feedback, enemy silhouettes, Playwright agent
- Fix: time dilation touch-only (keyboard stays full speed)

## 0.2.0 — 2026-06-06

- Input: relative touch delta, always-on auto-fire, time dilation (25% on idle 100ms)
- Player: 4px center hitbox (14px visual hull)
- Gameplay: star pickups, combo multiplier (3s decay), enemy bullet speed cap
- HUD: run stars, combo, boss HP bar placeholder, dilation overlay
- Docs: INPUT-SPEC.md; object pool wired for bullets

## 0.1.0 — 2026-06-06

- Initial scaffold: canvas vertical shmup inspired by Sky Force Reloaded
- Player movement (keyboard + touch), shield, weapon levels
- Enemy waves, power-ups, score/lives HUD
