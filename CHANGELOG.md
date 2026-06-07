# Changelog

## 0.6.0 — 2026-06-07

- Collection album: 12 permanent cards, unconfirmed-until-clear high-stakes drops from elites/crates
- Fleet hangar: 5 ships (Enforcer + 4 part-gated), equip before launch
- Destructibles: cargo crates, radar towers, fuel tanks with star/power-up fountains
- Mid-run medal HUD: live chips, slide banners on earn, Perfect cracks on first hit
- Ship/card passives merge into hangar stats; Ace luck boosts drop rates

## 0.5.0 — 2026-06-07

- Hangar: 8 upgrade categories (HP, cannon, wings, missiles, magnet, laser/shield/bomb stocks) with star costs
- Stage map: difficulty tiers Normal→Hard→Insane→Nightmare, 4 medals per stage, medal-gated unlocks
- Gameplay: magnet vacuum, homing missiles, wing cannons, hostages + rescue meter, enemy damage visuals
- Active abilities: laser beam (Z), energy shield (X), mega bomb (C); Focus Time at 20% on finger lift
- Friend score checkpoint marker on stage runs; stars bank with difficulty + medal bonuses

## 0.4.0 — 2026-06-07

- Stage 1 campaign: `StageDirector` + `data/stages/stage-01.json`, scripted formations → boss
- Title menu: Stage 1 vs Arcade Endless; star banking to localStorage on stage clear
- Boss tune: ~4200 HP stage boss / ~2450 wave-5 boss, denser patterns, phase-2 rage telegraph
- Arcade: wave progress blocked while boss is alive

## 0.3.4 — 2026-06-07

- Gameplay: wave boss every 5 waves (Debris Core, 2 phases), wave/boss banners
- Enemies: diver swoop formation, elite golden fighters every 3 waves
- Agent: logs bossActive/bossHpPct; heuristic avoids boss body + bullet-hell mode during fights

## 0.3.3 — 2026-06-07

- Agent: velocity-weighted bullet dodge, enemy ram avoidance, anti-spam streak breaker
- Agent: expose live enemy positions in `getState()` for heuristic steering
- Agent: progressive target raising when metrics crush current goals (tuner gen 2)

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
