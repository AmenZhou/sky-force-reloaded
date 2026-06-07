# Deep Mechanics — Risk/Reward Layers

**Companion docs:** [[GDD]], [[DRD]], [[ECONOMY-SPEC]], [[ROADMAP]]

Sky Force Reloaded stays addictive because gameplay **changes shape** mid-run — not just “hold finger, things explode.” This spec captures the **hidden layers** to build after the v0.4–v0.6 core loop (stages, hangar, bosses).

**Principle:** Every feature must force a **risk vs reward** decision visible within 30 seconds of encountering it.

---

## 1. Rogue-Lite Collectibles

### 1.1 Escort Crate (mid-level rare drop)

| Aspect | Spec |
|--------|------|
| Spawn rate | 1 per stage max; 15% roll on Stage 2+ |
| Visual | Large crate with blinking beacon; heavy inertia |
| Claim flow | Ship **magnet** must pull crate to **landing zone** (marked helipad at stage end) |
| Shooting crate | Each player hit adds **knockback impulse** — crate slides away; discourages clearing a path by blasting |
| Player hit | Crate **drops** (stays on field 5s); must re-magnet |
| Success reward | Permanent card roll: +10% fire rate, health regen, etc. |
| Failure | Crate despawn at stage end — no penalty beyond lost opportunity |

**Risk:** Dragging a wide hitbox through bullet hell.  
**Reward:** Permanent meta outside star economy.

**Implementation notes (v1.0):**

- `CrateEntity` with `mass`, `held`, `knockback`, `landingZoneId`
- Magnet strength from hangar level gates feasibility on low magnet builds
- JSON stage flag: `"objectives": [{ "type": "escort_crate", "zone": "pad_end" }]`

### 1.2 Wreckage Retrieval (social / async)

| Aspect | Spec |
|--------|------|
| Trigger | When a leaderboard entry dies, store `{ stageId, x, y, playerName, timestamp }` |
| In your run | Flaming wreck appears at that coordinate (once per stage) |
| Rescue | Hover 1.5s within 40px radius |
| Reward | **500★** bonus + score burst |
| Fallback (offline MVP) | Seed scripted wreckages from static JSON |

**Risk:** Hovering in place during dense patterns.  
**Reward:** Large currency spike — see [[ECONOMY-SPEC#3.3]] (500★ ≈ 25% of a Stage 1 clear).

**Privacy:** Store display name + coords only; no PII. Leaderboard v1.1+.

---

## 2. Technicians (Co-Pilot Build System)

Pre-stage loadout: **Ship × Technician** defines run rules. Ships alter stats; technicians alter **rules**.

### 2.1 Ships (v1.0)

| Ship | Tradeoff |
|------|----------|
| **Gladius** | +20% fire rate, -10% shield max |
| **Enforcer** | +30% range, -15% move speed |
| **Starter** | Balanced |

### 2.2 Technicians

| Technician | Effect | Synergy example |
|------------|--------|-----------------|
| **Slo-Mo Chan** | Aura: enemy bullets -20% speed in 120px radius | Gladius → aggressive close-range |
| **Kate Brush** | **First hit each stage negated** (shield not depleted) | Enforcer → sniper no-damage medal runs |
| **Holo Granny** | Every 12s spawn decoy ship 80px offset; homing enemies target decoy 4s | Enforcer → flank angles |
| **Tase MeBro** | Chain lightning zaps nearest enemy every 2s (close range) | Gladius → melee burst build |

**Unlock:** Stars + stage medal gates (e.g., Kate Brush after Stage 2 no-damage medal).

**Implementation:** `TechnicianModifier` hooks in `game.js`:

```javascript
// examples
onBulletSpawn(bullet) { if (sloMo) bullet.vy *= 0.8; }
onPlayerHit(damage) { if (kate && !kateUsed) { kateUsed = true; return 0; } }
onTimer() { holoGranny.trySpawnDecoy(); }
```

---

## 3. Gimmick Levels (Pacing Breaks)

Not every stage is “shoot everything.” Strip core power to teach new skills.

### 3.1 EMP / No-Shoot Stage (Stage 5 template)

| Rule | Spec |
|------|------|
| Guns | **Disabled** entire stage |
| Win condition | Reach exit marker + rescue ≥ 80% survivors |
| Enemy density | Lower DPS, higher bullet volume |
| Player tools | Move, time dilation, magnet (stars still matter) |
| Medals | “Pacifist” automatic; “Ace” = no hits |

**Reference:** Sky Force Reloaded Stage 5 fan favorite — pure pathing puzzle.

### 3.2 Darkness Stage

| Rule | Spec |
|------|------|
| Visibility | Screen black except **headlamp cone** (~60° , 140px radius) |
| Enemies | Muzzle flashes reveal turret positions 0.3s |
| Audio | Stereo pan on incoming shots (v0.7 audio required) |
| Optional | Radar blip upgrade from hangar |

**Risk:** Limited vision. **Reward:** Unique medal + high star multiplier (×1.5).

**Stage JSON:**

```json
{
  "gimmick": "emp_no_shoot",
  "lighting": "darkness",
  "lightConeDeg": 60,
  "starMult": 1.5
}
```

---

## 4. Multi-Part Flanking Bosses

Replace single HP bar sponges with **modular battleships**.

### 4.1 Structure

```
Boss
├── wingLeft  (submodule, targetable)
├── wingRight (submodule)
├── armorPlate (invuln until wings destroyed)
└── core      (exposed after plate breaks)
```

| Phase | Player goal | Boss behavior |
|-------|-------------|---------------|
| 1 | Destroy wing cannons | Side bullet streams |
| 2 | Break center plate | Railgun **aim laser** telegraph 1.2s |
| 3 | Core exposed | Spiral + enrage at 30% core HP |

### 4.2 UI

- Submodule HP pips on wings (see [[UI-SPEC]] boss bar extensions)
- Aim laser: red line + charge SFX before burst

### 4.3 Rewards

- Each submodule: star burst + combo opportunity
- Core kill: stage clear + card roll chance

**Data:** `data/bosses/dreadnought.json` with `parts[]` array, each with `hitbox`, `hp`, `patterns`, `onDestroy` events.

---

## 5. Micro-Mechanics (Emotion & Pressure)

### 5.1 Sassy hostages (survivors++)

Extend survivor pods (v0.8) with speech bubbles:

| State | Bubble |
|-------|--------|
| Idle | “Help!!” |
| Rescuing (progress 0–100%) | Smiling face icon |
| Abandoned mid-rescue | Scrambled angry symbols `#@!%` |
| Saved | “Thank you!” + small star bonus |

Rescue requires **2s channel** without leaving 50px radius — breaking channel resets progress.

### 5.2 Multiplier chain (extends v0.2 combo)

| Rule | Spec |
|------|------|
| Chain up | Kill within 3s → combo tier rises (×2→×3→×4) |
| Chain break | **Enemy escapes screen undamaged** → combo reset to ×1 |
| Score vs stars | ×4 applies to **score** always; stars use cap ×3 (see economy) |
| UI | HUD pulse on tier up; harsh sound on break |

**Design intent:** Forces aggressive pursuit of fleeing scouts — risk leaving safe lane.

### 5.3 Other micro (backlog)

| Mechanic | Spec | Version |
|----------|------|---------|
| Damage states | Smoke → fire → explode on enemies | v0.6 |
| Boss telegraph | 0.5s flash before lethal density | v0.5 |
| Star vacuum SFX | Pitch rises with combo tier | v0.7 |
| Hostage VIP | Gold pod, 3s channel, 200★ | v0.8 |

---

## 6. Feature → Roadmap Map

| Feature | Target version | Depends on |
|---------|----------------|------------|
| Chain break on escape | **v0.3** | Enemy off-screen detection |
| Modular boss (2 parts) | **v0.5** | Boss base class |
| Survivors + bubbles | **v0.8** | Stage objectives |
| Technician (1 starter) | **v0.9** | Loadout UI |
| Escort crate | **v1.0** | Magnet + landing zones |
| EMP stage | **v1.0** | Stage gimmick flags |
| Darkness stage | **v1.1** | Lighting shader / mask |
| Wreckage retrieval | **v1.1** | Leaderboard backend |
| Full technician roster | **v1.2** | Balance pass |

---

## 7. Acceptance Criteria (depth layer complete)

- [ ] At least **one** mid-run decision that is not “move and shoot” (crate, wreck, or hostage)
- [ ] Pre-stage loadout changes **rules**, not just stats
- [ ] One gimmick stage proves non-shoot skill
- [ ] One boss requires **ordered part destruction**
- [ ] Combo/chain break punishes passive play

---

*Last updated: 2026-06-06*
