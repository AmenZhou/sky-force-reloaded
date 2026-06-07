# Technical Architecture — Sky Force Reloaded (Browser)

**Repo:** `/Users/haimengzhou/apps/sky-force-reloaded`  
**Runtime:** Browser (ES modules, Canvas 2D)  
**Dev server:** `python3 -m http.server 8766`

---

## 1. Architecture Overview

```
sky_force_reloaded.html
        │
        ▼
   js/main.js          ← bootstrap, HUD DOM, resize, overlays
        │
        ▼
   js/game.js          ← Game loop, collision, wave/stage state
        │
   ┌────┴────┬──────────┬──────────┬──────────┐
   ▼         ▼          ▼          ▼          ▼
player   enemies    bullets    powerups   background
   │         │          │          │
   └─────────┴──────────┴──────────┴── entity pattern (x, y, radius, update, draw)
```

**Pattern:** Lightweight entity-component style without a framework — each module owns a list of plain objects with `update`/`draw` behavior inlined or on the Game class.

**Why not Phaser (yet):** v0.1 proves loop + feel with zero build tooling (matches `run-a-hotel`). Re-evaluate at v0.6 if particle count, sprite atlases, or audio complexity justify Vite + Phaser.

---

## 2. Module Responsibilities

| Module | Responsibility | Future splits |
|--------|----------------|---------------|
| `main.js` | DOM, canvas sizing, start/retry, HUD callbacks | `ui/hud.js`, `ui/menus.js` |
| `game.js` | rAF loop, input aggregation, collision, game rules | `stage.js`, `collision.js` |
| `player.js` | Ship movement, firing patterns, shield, power-up apply | `weapons.js` |
| `enemies.js` | Spawn patterns, enemy types, enemy AI fire | `spawner.js`, `boss.js` |
| `bullets.js` | Bullet pools (player + enemy) | `patterns.js` for boss bullets |
| `powerups.js` | Drop entities | merge with `pickups.js` + stars |
| `background.js` | Parallax layers | `stage-themes.js` per stage |

---

## 3. Game Loop

```javascript
loop(now):
  dt = clamp(now - lastTime, max=0.05)
  input → player movement + fire intent
  systems.update(dt): background, bullets, enemies, powerups, boss
  collision.resolve()
  stage/wave rules
  hud.sync(state)
  render: background → entities → player → FX → UI canvas overlay
```

- **Fixed logical resolution:** 360×640 — scale via CSS only
- **dt cap:** 50ms prevents spiral of death on tab blur
- **Collision:** Circle-circle AABB; switch to spatial hash if entity count > 100

---

## 4. State Model

### 4.1 Run state (in-memory)

```javascript
{
  mode: 'arcade' | 'stage',
  stageId: 1,
  wave: 1,
  score: 0,
  stars: 0,           // v0.4+
  lives: 3,
  combo: 0,
  comboTimer: 0,
  scrollSpeed: 40,
  phase: 'playing' | 'boss' | 'clear' | 'gameover'
}
```

### 4.2 Persistent state (localStorage, v0.4+)

```javascript
{
  hangar: { hp: 0, cannon: 0, magnet: 0, ... },
  unlockedStages: [1],
  medals: { '1': ['completion'] },
  highScores: { arcade: 12000, stage1: 5000 }
}
```

Key: `sky-force-reloaded/v1/save`

---

## 5. Input Layer

| Source | Move | Fire |
|--------|------|------|
| Keyboard | axes from key set | Space held |
| Pointer | moveToward touch | auto while down |
| Gamepad (stretch) | left stick | RT held |

**Sky Force alignment (v0.3):** Default **auto-fire always on**; Space optional for desktop. Pointer down = move only if auto-fire global.

Input normalized to canvas coordinates in `main.js` / `game.js` before simulation.

---

## 6. Rendering

- **Canvas 2D** single layer for MVP
- **Draw order:** background → powerups → enemies → bullets → player → boss overlays
- **FX (later):** particle pool in `fx.js`, additive glow via `globalCompositeOperation`

### Stage themes

Background module accepts theme config:

```javascript
{ sky: ['#020617','#172554'], starDensity: 40, clouds: true, debris: false }
```

---

## 7. Content Pipeline

### Stage scripts (v0.4)

JSON in `data/stages/stage-01.json`:

```json
{
  "id": 1,
  "name": "Orbital Debris",
  "sections": [
    { "at": 0, "spawn": "line", "enemy": "scout", "count": 5 },
    { "at": 45, "spawn": "boss", "type": "debris-core" }
  ]
}
```

`StageDirector` class reads timeline and commands `EnemyManager` — replaces pure random spawn for campaign mode.

---

## 8. Boss Architecture (v0.5)

```
js/boss/
  base-boss.js      — phases, hitboxes, HP bar hook
  debris-core.js    — stage 1 patterns
  pattern-lib.js    — reusable bullet emitters (fan, spiral, aim)
```

Boss is an `Enemy` subclass with:

- `phases[]` — each with `hpThreshold`, `patternId`, `duration`
- Weak points as child hit circles (optional)

---

## 9. Debug & Agent Hooks

Follow **`run-a-hotel`** / **`jet-pilot-simulator`** Playwright agent pattern.

### 9.1 Exposed API (on `window`)

```javascript
window.__SKY_FORCE__ = {
  getState: () => ({ score, wave, lives, player: { x, y, shield, weaponLevel }, enemies: n }),
  pause: () => {},
  resume: () => {},
  // deterministic seed for tests
  setSeed: (n) => {},
};
```

### 9.2 Agent layout (v0.7)

```
ai-agent/
  agent.js          — Playwright + LLM loop
  package.json      — playwright, openai/anthropic
  logs/run-*.jsonl  — structured telemetry
  SKILL.md          — run instructions
```

Agent observes HUD + `__SKY_FORCE__.getState()`, outputs move target or key holds. JSONL fields: `ts`, `score`, `wave`, `hp`, `action`, `death_cause`.

Reference: `/Users/haimengzhou/apps/run-a-hotel/ai-agent/agent.js` (Logger, tick loop, LLM provider switch).

---

## 10. File Structure (target)

```
sky-force-reloaded/
├── sky_force_reloaded.html
├── js/
│   ├── main.js
│   ├── game.js
│   ├── player.js
│   ├── enemies.js
│   ├── bullets.js
│   ├── powerups.js
│   ├── background.js
│   ├── stage-director.js    # v0.4
│   ├── save.js              # v0.4
│   └── boss/                # v0.5
├── data/stages/             # v0.4
├── docs/
│   ├── GDD.md
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── ai-agent/                # v0.7
├── CHANGELOG.md
└── README.md
```

---

## 11. Performance Budget

| Metric | Target |
|--------|--------|
| Frame rate | 60 fps on mid-tier phone |
| Entities | < 80 bullets + 30 enemies |
| Draw calls | Single canvas — batch by type |
| Load | < 500 KB total (no build, CDN tailwind only) |

**Later:** Self-host CSS or migrate to Vite if bundle grows.

---

## 12. Testing Strategy

| Layer | Tool | When |
|-------|------|------|
| Manual smoke | Browser | Every change |
| Deterministic seeds | Unit-ish in browser console | v0.3 |
| Playwright headless | `ai-agent` survival runs | v0.7 |
| Balance analysis | JSONL log parser script | v0.7+ |

No Jest in MVP — game logic is frame-based; prefer agent integration tests over mocked rAF.

---

## 13. Sibling Project Patterns

| Pattern | Source | Apply here |
|---------|--------|------------|
| Zero-build HTML entry | `run-a-hotel` | ✓ current |
| ES module split by domain | `run-a-hotel` js/ | ✓ current |
| Playwright + JSONL agent | both games | v0.7 |
| CHANGELOG + semantic versioning | both | ✓ |
| Vite + npm | `jet-pilot-simulator` | Only if 3D/WebGL needed — **not planned** |

---

## 14. Migration Triggers (Phaser/Vite)

Consider migration when **any** of:

- Sprite atlases > 20 sheets
- Particle systems > 200 concurrent
- Web Audio + 10+ simultaneous SFX
- Need TypeScript for stage script tooling

Until then, stay vanilla for fast iteration.

---

*Last updated: 2026-06-07 · v0.5*
