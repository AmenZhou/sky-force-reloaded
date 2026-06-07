# Backlog — v0.7 → v1.0

**Project:** `sky-force-reloaded`  
**Baseline:** v0.6 (Stage 1, hangar, cards, fleet, destructibles)  
**Goal:** Close gaps to a shippable “Sky Force–inspired” 1.0 without pixel-parity scope creep.

Priority: **P0** (next sprint) → **P1** (v0.8–0.9) → **P2** (v1.0 polish) → **P3** (post-1.0).

---

## P0 — v0.7 (next sprint)

### SKY-701 — Reduce enemy bullet density (balance pass)

**Status:** Done (uncommitted) — `js/balance.js`  
**Description:** Centralize tuning; slower fighter/tank fire, cap shooters/tick, thinner boss patterns.  
**Acceptance criteria:**
- [x] Single config file for enemy/boss bullet knobs
- [ ] Agent median hits/run unchanged or lower at same wave
- [ ] Human playtest: Stage 1 Normal readable at weapon Lv 1–2

---

### SKY-702 — Pause menu + mute prep

**Description:** S05 pause overlay — resume, restart stage, quit to map; hook for future audio mute.  
**Acceptance criteria:**
- [ ] `P` / pause button pauses simulation (`game.running = false`)
- [ ] Resume restores state; restart reloads same stage/difficulty
- [ ] Arcade pause → retry wave 1 or menu

**Open questions:** Pause during boss phase — yes (default).

---

### SKY-703 — Settings screen (minimal)

**Description:** S11 — SFX/music sliders (no audio yet = stored prefs), screen shake toggle, clear save with confirm.  
**Acceptance criteria:**
- [ ] Settings persist in localStorage
- [ ] Clear save resets hangar, cards, fleet, medals

---

### SKY-704 — Temporary card drops + timer UI

**Description:** Wire `temp_double_dmg` / `temp_star_rush` from collection-data; show active timer in hangar or HUD.  
**Acceptance criteria:**
- [ ] Rare drop from radar destroy (~3%)
- [ ] Timer counts down in real time; effect applies next run(s) within window
- [ ] Album section labels temporary vs permanent

---

### SKY-705 — Stage 2 skeleton (“Fleet Assault”)

**Description:** `data/stages/stage-02.json` + stage map unlock after Stage 1 clear; new BG tint; one boss.  
**Acceptance criteria:**
- [ ] Stage 2 appears on map when Stage 1 cleared once
- [ ] JSON timeline only (no random spawns in campaign)
- [ ] Distinct banner subtitle + boss name

**Design:** See GDD §8 — turret-heavy formations (use fighter/tank placeholders until SKY-806).

---

## P1 — v0.8–0.9 (content + depth)

### SKY-801 — Stage 3 skeleton (“Orbital Fortress”)

**Acceptance criteria:**
- [ ] Third stage on map; bullet-hell boss patterns
- [ ] All 3 stages support 4 difficulties + medals

---

### SKY-802 — Chain-break combo (economy spec)

**Description:** Enemy escapes screen undamaged → combo reset + 10% run-star penalty.  
**Acceptance criteria:**
- [ ] Off-screen escape detection on scouts/divers
- [ ] HUD flash + harsh SFX placeholder (console/log ok until audio)

---

### SKY-803 — Turret enemy type

**Description:** Fixed-position shooter in stage scripts; slower scroll, burst fire.  
**Acceptance criteria:**
- [ ] `type: "turret"` in JSON spawn
- [ ] Distinct silhouette + HP bar
- [ ] Used in Stage 2+ formations

---

### SKY-804 — Modular boss (2-part MVP)

**Description:** Wings → core on Stage 2 boss; submodule HP pips.  
**Acceptance criteria:**
- [ ] Destroy side cannons before core damage
- [ ] Star burst per submodule kill
- [ ] Phase telegraph (flash before burst)

---

### SKY-805 — Technician loadout (1 starter)

**Description:** Pre-stage pick **Slo-Mo Chan** (−20% enemy bullet speed in radius).  
**Acceptance criteria:**
- [ ] Loadout row on stage map before LAUNCH
- [ ] Modifier hook in `game.js` bullet update
- [ ] Unlock: Stage 1 Hard clear

---

### SKY-806 — Expand card album (#13–#24)

**Description:** Second half of permanent cards; duplicate protection on drop.  
**Acceptance criteria:**
- [ ] 24 slots in album UI
- [ ] Drops skip already-owned cards (roll again or star burst fallback)

---

### SKY-807 — Pre-stage consumable shop

**Description:** Buy shield/bomb charges before launch (ECONOMY-SPEC §7).  
**Acceptance criteria:**
- [ ] Flat pricing; max stock enforced
- [ ] Charges add to `runCharges` at start

---

## P2 — v1.0 (ship feature)

### SKY-901 — Web Audio SFX pack

**Acceptance criteria:**
- [ ] Shoot, hit, pickup, explosion, boss phase, medal earn
- [ ] Mute obeys settings

---

### SKY-902 — Escort crate objective

**Description:** MECHANICS-DEPTH §1.1 — magnet crate to pad; card on success.  
**Acceptance criteria:**
- [ ] One crate spawn per stage 2+ (JSON flag)
- [ ] Player shots knock crate away
- [ ] Landing zone at stage end

---

### SKY-903 — EMP gimmick stage template

**Description:** Guns disabled; reach exit + rescue quota.  
**Acceptance criteria:**
- [ ] Stage JSON `gimmick: "emp_no_shoot"`
- [ ] Player can still move, magnet, abilities
- [ ] Auto-award pacifist-style medal path

---

### SKY-904 — Friend wreckage / leaderboard stub → local seeds

**Description:** Replace score-only checkpoint with seeded wreckages from static JSON; 500★ rescue.  
**Acceptance criteria:**
- [ ] 3 seeded positions per stage
- [ ] Hover rescue meter (reuse hostage code)

---

### SKY-905 — Agent stage mode + balance CI

**Acceptance criteria:**
- [ ] `agent.js --stage --difficulty normal`
- [ ] Log parser fails CI if median Stage 1 deaths > 50% over 20 runs

---

### SKY-906 — Arcade star banking (optional mode)

**Description:** Toggle or fraction (50%) bank on game over for endless farmers.  
**Acceptance criteria:**
- [ ] Documented in results screen
- [ ] Lower multiplier than campaign (×0.5)

---

## P3 — Post v1.0

| ID | Title | Notes |
|----|-------|-------|
| SKY-1001 | Darkness stage + light cone | Requires canvas mask |
| SKY-1002 | Full technician roster (4) | Kate Brush, Holo Granny, Tase MeBro |
| SKY-1003 | Online leaderboard + async wreckage | Backend TBD |
| SKY-1004 | Capacitor iOS wrapper | Post-web polish |
| SKY-1005 | Remaining 4 ships | Match Reloaded roster count |

---

## Suggested sprint order (v0.7)

```mermaid
flowchart LR
  A[SKY-701 balance] --> B[SKY-702 pause]
  B --> C[SKY-703 settings]
  C --> D[SKY-704 temp cards]
  D --> E[SKY-705 stage 2]
```

**Estimated effort:** 701 done · 702–703 ~1 day · 704 ~0.5 day · 705 ~1–2 days.

---

## Definition of Done (v1.0)

- [ ] 3 campaign stages, all difficulties + medals
- [ ] Hangar + 24 cards + 5+ ships + technicians (≥1)
- [ ] Pause, settings, SFX
- [ ] One gimmick stage + one escort crate stage
- [ ] Modular boss on Stage 2+
- [ ] Agent completes Stage 1 Normal ≥50% runs
- [ ] Docs: FEATURES-AND-DESIGN + this backlog updated

---

*Last updated: 2026-06-07*
