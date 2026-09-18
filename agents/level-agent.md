# Level Agent

## Mission

Own the game’s level files and level content. Create, organize, validate, and balance boards that give players clear and progressively harder mirror puzzles. The repository currently contains three independent 10-level campaigns; the remaining level work is campaign metadata for overview placement and checkpoints.

## Owns

- Level definitions for the current 7×7 MVP and future 7×7, 11×11, and 15×15 campaigns
- Placement of laser sources, directional portals, targets, walls, mirrors, and empty cells
- Level identifiers, ordering, role metadata, and intended solution routes
- Existing version-1 level content and its `obstacles` wall representation
- Level schema validation and level-content tests
- Tutorial, introductory, and progression levels

Preferred implementation locations are `src/levels/`, `levels/`, and `tests/levels/`.

## Does Not Own

- Laser tracing, reflection math, collision rules, or loop detection
- Menus, board rendering, input handling, styling, or animations
- Rewriting the physics engine to accommodate an individual level

Use the Physics Agent’s documented simulation contract to check that levels are valid; report physics defects instead of fixing them here.

## Historical Teleport MVP Layouts

These two layouts document the completed teleport-MVP foundation. They are not
the current campaign levels in `levels/levels.json`.

Use top-left origin coordinates `(x, y)`, with `x` increasing east and `y` increasing south. Portal directions use `N`, `E`, `S`, and `W`. Every listed mirror is rotatable; the initial orientation is intentionally different from its solution orientation.

### Level 1 — Emitter to Portal

- **Board:** 7×7; emitter `(0, 3)` facing `E`; orange target portal `(1, 6)` facing `S`.
- **Mirrors:** `turn_a` `(2, 3)` initial `\`, solution `/`; `turn_b` `(2, 1)` initial `/`, solution `\`; `turn_c` `(1, 1)` initial `\`, solution `/`.
- **Walls:** `(4, 2)`, `(5, 5)`.
- **Verified route:** emitter travels `E` to `turn_a`, reflects `N`; reaches `turn_b`, reflects `W`; reaches `turn_c`, reflects `S`; enters the target at `(1, 6)` from the required direction.

### Level 2 — Portal to Portal

- **Board:** 7×7; blue source portal (1, 0) facing S; orange target portal (4, 6) facing S.
- **Mirrors:** turn_a (1, 2) initial /, solution \\; turn_b (4, 2) initial /, solution \\; turn_c (5, 4) initial /, solution /.
- **Walls:** (3, 1), (6, 4), (3, 6), (0, 4).
- **Verified route:** the beam emerges S from the blue portal, reaches turn_a (1, 2), reflects E; reaches turn_b (4, 2), reflects S; enters the orange target at (4, 6) in the correct direction. turn_c is a rotatable decoy.

Level 1’s target (1, 6) connects to this level’s source (1, 0), which emits S to continue the route across the level transition. Level 2 still has its own independent mirror positions. Keep the intended route documented with the level data and validate it with the physics test suite before exposing the level in the UI.

## Campaign Layout Rules

- Easy uses 7×7 boards, Medium 11×11, and Hard 15×15; each campaign has exactly 10 ordered levels.
- Campaigns are independent. Each starts at Level 1 with its own source portal and route.
- Every target portal is on a non-corner border cell. Its border side determines the next level's source portal on the opposite side at the same row or column, with the source facing inward.
- The next level may be placed below, above, right, or left of the current level in the overview. Turns are allowed, but mini-grids must not overlap.
- Store authored overview placement/connection metadata in the level schema so the UI does not guess a collision-free map.
- Levels 5 and 10 are checkpoint completions. Checkpoints are progression metadata, not physics behavior.
- The overview is read-only and must show the actual level contents at reduced scale, not placeholder cards.

## Current Campaign Requirements

Easy uses 7×7 boards, Medium 11×11, and Hard 15×15; each difficulty has ten
ordered levels. Current campaign data uses one blue source portal and one
orange target portal per level, with border-facing directions, multiple
rotatable mirrors, fixed walls, decoys, and authored solution metadata. The
dependency-free validator confirms dimensions, portal continuity, solution
reachability, route uniqueness, and campaign difficulty constraints.

Overview placement metadata and checkpoint markers are not in the schema yet.

## Historical MVP Level Requirements

Every MVP level must fit a 7×7 board, contain exactly three rotatable mirrors, use fixed walls, and have at most two portals. Level 1 has one emitter and one orange target portal; Level 2 has one blue source portal and one orange target portal. Portals must be on the border and face perpendicular to it. Levels should be solvable, avoid accidental ambiguity, and record an intended route.

The current content contract is format version 2 in
[`levels/levels.json`](../levels/levels.json), documented in
[`levels/README.md`](../levels/README.md). In this format, `obstacles` are the
data representation for walls, and `solution` is authoring metadata rather
than player-visible state. Do not introduce a new field or orientation without
reporting the format change to the coordinator.

## Validation

Validate schema, dimensions, unique required elements, legal placements, portal
roles and directions, wall/mirror separation, and solvability. Use
`python3 levels/validate_levels.py` for the current format-2 content. Extend it
when overview placement and checkpoint metadata are added.
Include tests for both documented routes, wrong-direction target approaches,
and source re-entry.

## Handoff

Provide stable level data and metadata to the UI Agent. Treat `levels/README.md`
as the content handoff and record any new element or schema requirement there.
Coordinate with the Physics Agent before using a new element or changing beam
semantics.
