# Sky Force Reloaded (Browser)

Vertical shoot-em-up in the browser, inspired by **Sky Force Reloaded** — scrolling starfield, twin-stick-style movement, wave-based enemies, shield + weapon power-ups.

## Play online

**https://amenzhou.github.io/sky-force-reloaded/**

(GitHub Pages — deploys automatically on push to `main`.)

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
| Touch / drag | Move ship (relative delta) |
| Auto | Fire while playing |
| `← → ↑ ↓` / WASD | Move (desktop) |
| `Z` / `X` / `C` | Laser / energy shield / mega bomb |
| Lift finger | Focus Time (20% slow-mo) |

## Features (v0.6)

- **Hub:** Hangar (Upgrades · Fleet · Album) · Stages · Arcade
- **Collection:** 12 permanent cards + ship parts — unconfirmed until stage clear
- **Fleet:** 5 ships with distinct stats (part-gated unlocks)
- **Destructibles:** Crates, radar towers, fuel tanks
- **Medals:** Live HUD chips + slide banners + Perfect crack on first hit
- **Campaign:** Stage 1 with hostages, boss, destructible placements

See **`docs/FEATURES-AND-DESIGN.md`** for the full design reference and **`CHANGELOG.md`** for history.

## Project layout

```
sky-force-reloaded/
├── sky_force_reloaded.html   # Entry page
├── data/
│   ├── economy/hangar.json   # Shop costs & growth curves
│   └── stages/stage-01.json
├── docs/
│   ├── FEATURES-AND-DESIGN.md # ★ Master reference — all features & design (v0.5)
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
| **FEATURES-AND-DESIGN** | **Start here** — implemented features, modes, hangar, medals, controls |
| **GDD** | Core loop, enemies, stages, economy overview |
| **DRD** | Five design pillars + acceptance criteria |
| **ECONOMY-SPEC** | Star income formulas, upgrade cost curves, pacing tables |
| **MECHANICS-DEPTH** | Escort crates, technicians, EMP/darkness stages, modular bosses |
| **UI-SPEC** | Hangar, HUD, results screens |
| **ROADMAP** | v0.2 → v1.2 delivery phases |
| **BACKLOG-v0.7-v1.0** | Prioritized tickets to v1.0 |

## Roadmap (summary)

**Done through v0.5:** stages, hangar, medals, hostages, abilities, agent.

**Next:** Stage 2–3 · pause/settings · audio · chain-break combo · technicians · gimmick stages (see ROADMAP.md).
