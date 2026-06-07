# Sky Force Reloaded (Browser)

Vertical shoot-em-up in the browser, inspired by **Sky Force Reloaded** — scrolling starfield, twin-stick-style movement, wave-based enemies, shield + weapon power-ups.

## Quick start

**Option A — open the file (simplest)**  
Double-click `sky_force_reloaded.html` or open from your editor preview.

**Option B — local HTTP server (recommended if scripts fail to load)**

```bash
cd /Users/haimengzhou/apps/sky-force-reloaded
python3 -m http.server 8766
```

Open **http://localhost:8766/sky_force_reloaded.html**

## Controls

| Input | Action |
|-------|--------|
| `← →` / `A D` | Move ship |
| `Space` (hold) | Fire |
| Touch / drag | Move + auto-fire |

## Features (v0.1)

- Parallax scrolling background
- Player ship with shield bar and 4 weapon levels
- Enemy formations: scouts, fighters, tanks
- Power-ups: weapon upgrade (W), shield refill (S)
- Wave progression with increasing difficulty
- Score, lives, and game-over retry flow

## Project layout

```
sky-force-reloaded/
├── sky_force_reloaded.html   # Entry page
├── docs/
│   ├── GDD.md                # Game design document
│   ├── ARCHITECTURE.md       # Technical architecture
│   └── ROADMAP.md            # Phased delivery plan
├── js/
│   ├── main.js               # Bootstrap + HUD
│   ├── game.js               # Game loop + collisions
│   ├── player.js
│   ├── enemies.js
│   ├── bullets.js
│   ├── powerups.js
│   └── background.js
└── README.md
```

## Design docs

See **`docs/GDD.md`**, **`docs/DRD.md`**, **`docs/UI-SPEC.md`**, **`docs/ARCHITECTURE.md`**, and **`docs/ROADMAP.md`** for the full design-first plan (2026-06-06).

## Roadmap

- Boss fights per wave milestone
- Co-op / wingman ships
- Persistent upgrades between runs
- Playwright AI agent (see `run-a-hotel` / `jet-pilot-simulator` patterns)
