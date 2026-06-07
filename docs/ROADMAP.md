# Roadmap — Sky Force Reloaded (Browser)

Phased delivery from current **v0.1 scaffold** to playable **campaign MVP**.

---

## Current Baseline (v0.1) ✓

| Delivered | Notes |
|-----------|-------|
| Canvas shmup loop | 360×640 logical |
| Player move + fire | Keyboard + touch |
| Shield / lives / game over | 3 lives |
| 3 enemy types + random formations | scouts, fighters, tanks |
| Power-ups W/S | Weapon + shield |
| Endless waves | Kill quota → next wave |
| Parallax background | Stars + clouds |

**Play:** `python3 -m http.server 8766` → `sky_force_reloaded.html`

---

## Phase 1 — Feel polish (v0.2)

**Goal:** Match Sky Force **control feel** before adding content.

| Task | Acceptance criteria |
|------|---------------------|
| Always-on auto-fire | Ship fires without holding Space; Space optional |
| Star pickups as entities | Enemies drop collectible stars (+score) |
| Combo multiplier | 3s decay; HUD shows combo × |
| Enemy bullet readability | Distinct color/size; max speed cap |
| Boss HP bar placeholder | UI slot ready for v0.5 |

**Done when:** 5-min playtest feels fair on mobile Safari + Chrome desktop.

---

## Phase 2 — Stage framework (v0.3–v0.4)

**Goal:** Replace endless-only with **Stage 1 campaign**.

| Task | Acceptance criteria |
|------|---------------------|
| `StageDirector` + JSON script | Stage 1 loads from `data/stages/stage-01.json` |
| Stage select screen | Title → Stage 1 / Arcade mode |
| Pause menu | Pause/resume; mute prep hook |
| `localStorage` save | High score + stage unlock persist |
| Star currency | Stars banked on stage end |

**Done when:** Stage 1 playable start-to-finish with clear results screen.

---

## Phase 3 — Boss & content (v0.5)

**Goal:** First real boss fight + 3 stages.

| Task | Acceptance criteria |
|------|---------------------|
| Boss base class + patterns | Fan, spiral, aimed streams |
| Stage 1 boss: Debris Core | 2 phases, defeat → clear |
| Stage 2–3 skeleton | Unique BG theme + boss each |
| Turret enemy type | Fixed shooter in formations |

**Done when:** All 3 stages completable; Arcade mode still available.

---

## Phase 4 — Hangar meta (v0.6)

**Goal:** Persistent progression loop (simplified Sky Force hangar).

| Task | Acceptance criteria |
|------|---------------------|
| Hangar UI | Spend stars: HP, cannon, magnet (3 modules) |
| Upgrades affect run | HP/shield max, starting weapon level |
| Upgrade persistence | Survives refresh via localStorage |

**Done when:** Player must replay Stage 1 to farm stars before beating Stage 2 on first account.

---

## Phase 5 — Audio & juice (v0.6–v0.7)

| Task | Acceptance criteria |
|------|---------------------|
| Web Audio SFX | Shoot, hit, explosion, pickup, boss phase |
| Screen shake + flash | On player hit and boss phase change |
| Background music loop | Optional mute in settings |

---

## Phase 6 — AI agent & balance (v0.7)

**Pattern:** `run-a-hotel/ai-agent`, `jet-pilot-simulator/ai-agent`

| Task | Acceptance criteria |
|------|---------------------|
| `window.__SKY_FORCE__.getState()` | Stable JSON snapshot |
| `ai-agent/agent.js` | Playwright headless 60s survival run |
| JSONL logs | score, wave, deaths, actions |
| Log analyzer script | Summarize death causes / wave reach |

**Done when:** Agent completes Stage 1 ≥50% of runs; logs inform one balance patch.

---

## Phase 7 — Medals & difficulty (v0.8)

| Task | Acceptance criteria |
|------|---------------------|
| 4 medals per stage | Completion, no-damage, score, time |
| Difficulty tier | Normal / Hard (HP ×1.5, fire ×1.2) |
| Medal gates | Hard mode + Stage N+1 unlock |

---

## Stretch (v1.0+)

- Manual power-ups: bomb, laser, energy shield
- Second ship unlock
- Endless leaderboard (local)
- Capacitor iOS wrapper

---

## v0.1 → Roadmap mapping

```
v0.1 scaffold
    ├── v0.2 feel (auto-fire, stars, combo)
    ├── v0.4 stages (director, save, select)
    ├── v0.5 bosses (3 stages)
    ├── v0.6 hangar + audio
    ├── v0.7 agent QA
    └── v0.8 medals
```

---

## Suggested next orchestration run

```
/task-orchestrate implement v0.2 feel polish for sky-force-reloaded
```

Phases: auto-fire → star entities → combo HUD → playtest fix pass.

---

## Registry

| Item | Value |
|------|-------|
| Path | `/Users/haimengzhou/apps/sky-force-reloaded` |
| Remote | Not yet created — push to `AmenZhou/sky-force-reloaded` when ready |
| Tech | HTML, Canvas 2D, ES modules |

---

*Last updated: 2026-06-06*
