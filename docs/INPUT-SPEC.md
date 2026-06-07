# Input Specification — Sky Force Reloaded (Browser)

**Version:** 1.0 · **ROADMAP:** v0.2 · **UI reference:** `UI-SPEC.md` S04, S06

---

## 1. Design goals

1. **Relative touch** — finger delta moves the ship; ship never jumps under the thumb.
2. **Always-on primary fire** — Sky Force style; player focuses on positioning.
3. **Time dilation** — brief slow-mo when control is released to plan dodges / power-ups.
4. **Fair hitbox** — small center circle for collisions; large visual hull.

---

## 2. Coordinate space

| Property | Value |
|----------|-------|
| Logical canvas | 360 × 640 px |
| Ship Y bounds | 45% – 100% of canvas height |
| Ship X bounds | `hitboxRadius` – `width - hitboxRadius` |

---

## 3. Touch / pointer

| Parameter | Value |
|-----------|-------|
| Mode | **Relative delta** |
| On `pointerdown` | Store pointer canvas position; do **not** move ship to finger |
| On `pointermove` | `ship += (current - previous) * sensitivity` |
| Sensitivity | `1.0` (1:1 delta in canvas px) |
| On `pointerup` | Stop applying delta; start idle timer for dilation |

---

## 4. Keyboard (desktop)

| Key | Action |
|-----|--------|
| `←` `→` / `A` `D` | Horizontal move |
| `↑` `↓` / `W` `S` | Vertical move (within bounds) |
| `Space` | Optional manual fire (redundant — auto-fire always on) |

Keyboard movement **prevents** time dilation while any movement key is held.

---

## 5. Auto-fire

| Rule | Value |
|------|-------|
| Enabled when | Game `running === true` and lives > 0 |
| Rate | Weapon level cooldown table (player.js) |
| Desktop | Fires without holding Space |
| Touch | Fires while playing (independent of pointer down) |

---

## 6. Time dilation (S06)

| Parameter | Value |
|-----------|-------|
| Trigger | Touch: no pointer for **≥ 100 ms** after drag (keyboard-only play stays full speed) |
| Time scale | **0.25** (25% speed) |
| Affects | Entire simulation `dt * timeScale` (player, bullets, enemies, scroll) |
| UI | `#dilation-overlay` — thin cyan ring on canvas wrapper; hidden at full speed |
| Exit | Pointer down or movement key → full speed immediately |

**Not** the pause menu — no modal, game continues visible.

---

## 7. Hitbox

| Property | Visual hull | Hitbox |
|----------|-------------|--------|
| Radius | 14 px | **4 px** |
| Position | Ship center | Ship center |
| Used for | Drawing only | Player vs enemy, enemy bullet, pickup |

Optional debug: `?debug=1` draws hitbox circle (future).

---

## 8. Collision notes

- Enemy hull collisions use enemy `radius` vs player **hitbox** radius.
- Pickups use generous collection radius (~18 px) vs hitbox center.

---

## 9. Acceptance checklist (v0.2)

- [ ] Dragging finger moves ship by delta, not teleport
- [ ] Ship auto-fires from LAUNCH without Space
- [ ] Lifting finger / idle 100 ms slows game to 25%
- [ ] Player can dodge through tight gaps (4 px hitbox)
- [ ] Dilation overlay visible during slow-mo

---

*Last updated: 2026-06-06*
