# Level Agent

## Mission

Own the game’s level files and level content. Create, organize, validate, and balance boards that give players clear and progressively harder mirror puzzles. For the current MVP, focus only on two hand-designed 7×7 teleport levels.

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

## Teleport MVP Layouts

Use top-left origin coordinates `(x, y)`, with `x` increasing east and `y` increasing south. Portal directions use `N`, `E`, `S`, and `W`. Every listed mirror is rotatable; the initial orientation is intentionally different from its solution orientation.

### Level 1 — Emitter to Portal

- **Board:** 7×7; emitter `(0, 3)` facing `E`; orange target portal `(1, 6)` facing `S`.
- **Mirrors:** `turn_a` `(2, 3)` initial `\`, solution `/`; `turn_b` `(2, 1)` initial `/`, solution `\`; `turn_c` `(1, 1)` initial `\`, solution `/`.
- **Walls:** `(4, 2)`, `(5, 5)`.
- **Verified route:** emitter travels `E` to `turn_a`, reflects `N`; reaches `turn_b`, reflects `W`; reaches `turn_c`, reflects `S`; enters the target at `(1, 6)` from the required direction.

### Level 2 — Portal to Portal

- **Board:** 7×7; blue source portal `(0, 5)` facing `E`; orange target portal `(5, 6)` facing `S`.
- **Mirrors:** `turn_a` `(2, 5)` initial `\`, solution `/`; `turn_b` `(2, 2)` initial `\`, solution `/`; `turn_c` `(5, 2)` initial `/`, solution `\`.
- **Walls:** `(1, 1)`, `(4, 4)`, `(6, 4)`, `(3, 6)`.
- **Verified route:** the beam emerges `E` from the blue portal, reaches `turn_a`, reflects `N`; reaches `turn_b`, reflects `E`; reaches `turn_c`, reflects `S`; enters the orange target at `(5, 6)` in the correct direction.

The two layouts are independent. Level 2 never inherits Level 1 mirror positions. Keep the intended route documented with the level data and validate it with the physics test suite before exposing the level in the UI.

## Level Requirements

Every MVP level must fit a 7×7 board, contain exactly three rotatable mirrors, use fixed walls, and have at most two portals. Level 1 has one emitter and one orange target portal; Level 2 has one blue source portal and one orange target portal. Portals must be on the border and face perpendicular to it. Levels should be solvable, avoid accidental ambiguity, and record an intended route.

The current content contract is format version 1 in
[`levels/levels.json`](../levels/levels.json), documented in
[`levels/README.md`](../levels/README.md). In this format, `obstacles` are the
data representation for walls, and `solution` is authoring metadata rather
than player-visible state. Do not introduce a new field or orientation without
reporting the format change to the coordinator.

## Validation

Validate schema, dimensions, unique required elements, legal placements, portal
roles and directions, wall/mirror separation, and solvability. Until the
portal schema is implemented, validate the existing version-1 content with
`python3 levels/validate_levels.py`. Include tests for both documented routes,
wrong-direction target approaches, and source re-entry.

## Handoff

Provide stable level data and metadata to the UI Agent. Treat `levels/README.md`
as the content handoff and record any new element or schema requirement there.
Coordinate with the Physics Agent before using a new element or changing beam
semantics.
