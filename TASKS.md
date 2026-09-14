# Current Tasks

This is the practical plan for the teleport MVP. Keep unfinished work visible here while active; move paused or partially completed work to `backlog.md`.

## Teleport MVP Scope Confirmed

- [x] MVP uses Easy-style 7×7 boards and starts directly at Level 1; difficulty selection is deferred.
- [x] MVP contains two hand-designed levels with exactly three rotatable mirrors each.
- [x] Level 1 is laser emitter → orange target portal; Level 2 is blue source portal → orange target portal.
- [x] Portals are border-fixed, perpendicular to the border, and show directional arrows; no level has more than two portals.
- [x] A target hit requires entering the orange portal from its correct direction.
- [x] Three lives are shared across both levels; losing all lives returns the player to Level 1 with three lives.
- [x] Failed beams remain visible briefly, then hide; successful portals animate before automatic level progression.
- [x] The final completion screen has **Play Again** only; **Reset** remains an in-game control.
- [x] Offline static web game with no accounts, backend, score, or move counter.

## Design Before Implementation

- [x] Have the laser-UI agent review the portal colors, arrows, target-entry feedback, and automatic Level 1 → Level 2 transition.
- [x] Confirm the UI animation timing and accessible labels for source and target portals.
- [x] Record the final level coordinates and intended solution routes before editing runtime files.

## Foundation

- [x] Choose the minimal web stack and create the static entry point.
- [x] Add the project scripts and document actual local commands in `README.md`.
- [x] Add source, level, test, and asset directories.

## Existing Physics Foundation

- [x] Trace the laser one cell at a time from its source.
- [x] Stop the beam at board boundaries and walls.
- [x] Implement reflection for each supported mirror orientation.
- [x] Detect target hits and expose a completed state.
- [x] Detect repeated positions and prevent infinite laser loops.
- [x] Add deterministic tests for movement, reflection, collisions, and loops.

The physics MVP is implemented in `src/physics/geometry.js` and
`src/physics/laser.js`, with tests under `tests/physics/`.

## Physics Agent

- [x] Define grid coordinates, four movement directions, and mirror orientations.
- [x] Define the portal roles, colors, border-facing directions, and failure cases in `agents/physics-agent.md`.
- [x] Extend the physics contract for directional portal sources and target entry.
- [x] Expose source/target portal events without coupling physics to rendering.
- [x] Treat wrong-direction portal entry, source re-entry, walls, boundaries, and loops as failures.
- [ ] Add a dedicated deterministic test for a portal-loop terminal; generic loop termination is already covered.

## Level Agent

- [x] Define the level-file schema and documented validation rules.
- [x] Add the dependency-free level validator at `levels/validate_levels.py`.
- [x] Design a clear 7×7 Level 1 with an emitter, orange target portal, three mirrors, and two walls.
- [x] Design a clear 7×7 Level 2 with blue/orange portals, three mirrors, and four walls.
- [x] Verify the intended reflection route for each level with the existing simulator; portal-entry runtime tests remain pending.
- [x] Extend the schema for portal role, border position, facing direction, and transition metadata.
- [x] Update the dependency-free runtime/content validator for the format-version-2 MVP.

## UI Agent

- [x] Render the existing board and all fixed and interactive elements.
- [x] Render blue source portals, orange target portals, and directional arrows.
- [x] Animate portal activation, beam entry, and the automatic transition to Level 2.
- [x] Hide the beam until **Fire Laser** is pressed.
- [x] Rotate mirrors by click/tap and animate the beam one cell at a time.
- [x] Disable mirror and gameplay controls during beam playback.
- [x] Display one shared life pool across both levels and restart Level 1 after the third Level 2 failure.
- [x] Keep **Reset** during gameplay and make final **Play Again** restart the full MVP.
- [x] Use simple geometric visuals with animation hooks that can support future polish.

## Integration and Verification

- [x] Keep physics independent from rendering and input.
- [x] Connect portal level data, physics results, and UI rendering without duplicating rules.
- [x] Verify both successful routes, wrong-direction target entry, portal re-entry, life carry-over, and full restart.
- [x] Verify the Level 1 → Level 2 transition and final **Play Again** flow in Chrome.
- [x] Run the full automated suite after portal support is implemented (17 tests passing).

## Future, Not MVP

- [ ] Add 15 levels per difficulty: Easy 7×7, Medium 11×11, and Hard 15×15.
- [ ] Add difficulty selection and future **Continue** progression.
- [ ] Add the monster target at level 15 of each difficulty.
- [ ] Add custom art, sound, keyboard accessibility, and richer effects.
