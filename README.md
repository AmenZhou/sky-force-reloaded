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

## Features (v0.2)

- Relative touch movement, always-on auto-fire, time dilation on idle
- Star pickups, combo multiplier, 4px hitbox
- See **`CHANGELOG.md`** for full history

## Project layout

```
sky-force-reloaded/
├── sky_force_reloaded.html   # Entry page
├── data/
│   ├── economy/hangar.json   # Shop costs & growth curves
│   └── stages/stage-01.json
├── docs/
│   ├── GDD.md                # Game design document
│   ├── DRD.md                # Design requirements (5 pillars)
│   ├── ECONOMY-SPEC.md       # Hangar pricing math & star income
│   ├── MECHANICS-DEPTH.md    # Risk/reward layers (crates, techs, gimmicks)
│   ├── INPUT-SPEC.md         # Controls & feel
│   ├── UI-SPEC.md            # Screen wireframes
│   ├── ARCHITECTURE.md       # Technical architecture
│   └── ROADMAP.md            # Phased delivery plan
├── js/
│   └── ...
└── README.md
```

## Design docs

| Doc | Contents |
|-----|----------|
| **GDD** | Core loop, enemies, stages, economy overview |
| **DRD** | Five design pillars + acceptance criteria |
| **ECONOMY-SPEC** | Star income formulas, upgrade cost curves, pacing tables |
| **MECHANICS-DEPTH** | Escort crates, technicians, EMP/darkness stages, modular bosses |
| **UI-SPEC** | Hangar, HUD, results screens |
| **ROADMAP** | v0.2 → v1.2 delivery phases |

## Roadmap (summary)

1. **v0.4** — Stage framework + star banking  
2. **v0.6** — Hangar (HP, cannon, magnet) with exponential costs  
3. **v0.8** — Medals + survivors  
4. **v0.9–v1.2** — Technicians, gimmick stages, modular bosses, escort crates
