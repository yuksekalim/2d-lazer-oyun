# Current Tasks

This is the practical plan for the teleport MVP. Keep unfinished work visible here while active; move paused or partially completed work to `backlog.md`.

## Teleport MVP Scope Confirmed

- [x] MVP uses Easy-style 7×7 boards and starts directly at Level 1; difficulty selection is deferred.
- [x] MVP contains two hand-designed levels with exactly three rotatable mirrors each.
- [x] Level 1 is laser emitter → orange target portal; Level 2 is blue source portal → orange target portal.
- [x] Portals are border-fixed, perpendicular to the border, and show directional arrows; no level has more than two portals.
- [x] Connect the two MVP levels continuously: Level 1’s bottom target maps to Level 2’s top source on the same column and direction.
- [x] A target hit requires entering the orange portal from its correct direction.
- [x] Three lives are shared across both levels; losing all lives returns the player to Level 1 with three lives.
- [x] Failed beams remain visible briefly, then hide; successful portals animate before automatic level progression.
- [x] The final completion screen has **Play Again** only; **Reset** remains an in-game control.
- [x] Offline static web game with no accounts, backend, score, or move counter.

## Campaign System Scope Confirmed

- [ ] Show a difficulty screen before gameplay; do not add level selection.
- [ ] Build independent Easy, Medium, and Hard campaigns with 15 levels each on 7×7, 11×11, and 15×15 boards.
- [ ] Render a desktop-only overview containing all 15 actual mini-grids, then zoom into Level 1.
- [ ] Connect consecutive levels using border portals: the next source is on the opposite border at the same row or column; corner portals are forbidden.
- [ ] Author overview placements so connected boards can turn without overlapping.
- [ ] Preserve the connected overview/zoom transition between levels and after checkpoint restarts.
- [ ] Use one shared pool of three lives per campaign; checkpoints activate after Levels 5 and 10 and restore three lives.
- [ ] Restart at Level 1, 6, or 11 after losing all lives in the corresponding campaign segment.
- [ ] Reset campaign selection, lives, and checkpoint progress on page refresh; do not persist data yet.
- [ ] Show **Play Again** and **Choose Difficulty** after Level 15.

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
- [x] Add a dedicated deterministic test for a portal-loop terminal; generic loop termination is already covered.

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

## Campaign Implementation Order

- [ ] Extend the level schema with campaign metadata, checkpoint markers, and non-overlapping overview positions.
- [ ] Add validator/tests for campaign counts, grid sizes, border connections, corner exclusion, and solvability.
- [ ] Add the desktop difficulty screen and campaign overview renderer.
- [ ] Implement camera zoom, automatic level transitions, checkpoint restart, and campaign completion actions.
- [ ] Author and verify all 15 Easy levels, then Medium and Hard.
- [ ] Add the monster target at Level 15 of each campaign.

## Agent Review

- [x] Review the physics agent commit and apply its directional portal validation, portal events, and loop tests.
- [x] Review the UI agent commit; retain only compatible animation/status improvements in the current MVP.
- [ ] Rework the UI campaign prototype around the confirmed difficulty screen, real 15-board overview, checkpoint flow, and final actions.
- [ ] Rework the level prototype so each campaign has 15 levels and consecutive border portals connect on the same row or column without corners.

## Later, Not in Campaign Foundation

- [ ] Persistent progress or user accounts.
- [ ] Sound, custom art, and additional gameplay systems.
