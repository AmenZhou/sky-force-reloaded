# Research Brief — Sky Force Reloaded (reference patterns)

**Purpose:** Design inspiration for UX, pacing, and juice — not asset copying.  
**Source:** Public gameplay patterns from vertical shmups / Sky Force series (reference only).

---

## HUD & feedback

- **Run vs bank stars:** Reference games show run earnings during stage and an explicit **bank on clear** moment. Our HUD should distinguish `Run ★` (at risk) from hangar total.
- **Section banners:** Large centered wave/section titles with color coding (assault vs bombardment vs boss).
- **Boss intro:** Name + health bar + short telegraph pause before first pattern.
- **Hit feedback:** Brief shield flash + combo counter when chaining kills.

## Stage flow

- **Sections as acts:** Each section changes enemy mix and background mood; player should feel progression every 30–60s.
- **BOMBARDMENT:** Ground targets (depots, radar) are mandatory pacing gates before boss — telegraph with map markers or banner text.
- **Hostages:** Optional risk/reward — rescue adds run ★ multiplier feel even if stars bank only on clear.

## Star economy

- Kills and destructibles increment **run stars** during stage.
- **Clear bonus** + medal multipliers on results screen.
- Fleet unlocks spend **banked** stars — never confuse with mid-run counter.

## Juice (fun proxies)

- Screen shake on boss hits and player damage (subtle).
- Star burst particles on kill clusters.
- Slow-mo on near-miss or last-life tension (already in DRD).
- Clear screen: medals, rescued count, stars banked animation.

## Backlog candidates (RESEARCH)

| Item | Rationale |
|------|-----------|
| Clear-screen star bank animation | Reduces `[UX]` confusion about when stars count |
| Section subtitle for BOMBARDMENT objectives | Reduces `[FUN]` stall when agent/player ignores depots |
| Boss pattern telegraph (1s warning) | Improves fairness and learnability |
| Medal toast on earn (not only end screen) | Increases mid-run engagement |

---

## How to use

```bash
node research/fetch-brief.js --profile sky-force-reloaded
node research/fetch-brief.js --profile sky-force-reloaded --topic HUD
```

Skill Phase 2b: when `[UX]` or `[FUN]` issues ≥ 1, attach relevant rows to `ai-agent/backlog.md` as `[RESEARCH]` items.
