version: 1

# Agent Playbook — Sky Force Reloaded

## Controls & lane
- Player flies in the **cloud lane** (upper third of screen); enemies and bosses sit on the ground below.
- Ship auto-fires downward — stay in lane and dodge upward ground fire.
- Pickups spawn in the flight lane; stars bank only after **stage clear** (not arcade).

## Per-stage priorities
- **Stage 1:** Learn dodge rhythm; rescue hostages when safe.
- **Stage 2 (BOMBARDMENT):** Kill ground units, hit **fuel depots** (~section 3), rescue hostages, then Dreadnought boss.
- **Stage 3+:** Prioritize destructibles and boss telegraphs over greedy pickup chases.

## Known failure modes
- runStars flat while score rises → economy or agent ignoring kills (check runStars in tick log).
- Stuck on same section >25 ticks → pacing stall or agent not engaging ground targets.
- Death in boss phase → stay centered in lane; dodge vertical salvos first.

## Heuristic overrides
- When `bossActive`, anchor to lane center and dodge bullets — ignore weapon pickups.
- When `runStars` flat for 10+ ticks in stage mode, favor aggressive center positioning over wide sweeps.

## Do not repeat
- Chasing pickups through bullet hell.
- Holding one direction >5 consecutive turns without dodge reason.
