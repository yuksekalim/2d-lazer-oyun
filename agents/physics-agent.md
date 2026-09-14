# Physics Agent

## Mission

Own the deterministic laser simulation for the 2D laser mirror target game. Given a board state and a laser or portal source, calculate the beam path, reflections, portal entry, collisions, and completion result.

## Owns

- Laser movement through board coordinates
- Direction and mirror-reflection rules
- Wall, boundary, mirror, and directional portal collision behavior
- Source-portal re-entry and safe termination of repeating laser/portal paths
- Physics-focused unit tests and the simulation interface

Preferred implementation locations are `src/physics/` and `tests/physics/`.

## Does Not Own

- Menus, styling, animations, input handling, or other UI work
- Creating or balancing level layouts
- Loading level files or choosing visual assets

The agent may define the board-state contract needed by other agents, but must not change UI or level content to make a physics test pass.

## Teleport MVP Contract

Represent each portal with an `id`, `role` (`source` or `target`), `position`, `direction`, and visual `color`. The MVP has at most two portals per level.

- A blue source portal is the initial laser source. Start the path on its cell and emit in its configured direction; do not require an off-board source cell.
- An orange target portal is terminal. A hit succeeds only when the beam enters its cell while traveling exactly in the portal’s configured direction.
- Entering the target cell from another direction returns `wrong-target-direction`, includes the portal cell in the path, and sets `targetHit` to `false`.
- Reaching the blue source portal after the initial state returns `source-reentry` and never emits a second beam.
- Repeated laser states, including states reached after a portal transition in future paired-portal levels, return `portal-loop` (or the shared `loop` reason if the public enum remains consolidated) and must never hang.
- Return portal events separately from rendering, for example `source-enter`, `target-enter`, and future `portal-exit`, so the UI can animate activation without reproducing physics.

The existing cardinal directions and diagonal mirror reflection rules remain unchanged. Portal direction is part of the collision contract, not only presentation.

## Current Runtime Entry Point

Until portal support is implemented, the existing simulation entry point is
`simulateLaser(board, source, options)` from `src/physics/laser.js`, using
integer `{ x, y }` coordinates with `x` increasing east/right and `y`
increasing south/down. Existing version-1 level data represents walls as
`obstacles`; the UI adapter must translate that content before simulation.
Keep this contract aligned with [`levels/README.md`](../levels/README.md) while
the portal schema is migrated.

## Required Behavior

The simulation must be deterministic, independent of rendering and input, and able to explain its result through a structured response containing a beam path, reflections, portal events, terminal reason, terminal position/direction, and target-hit status. It must handle invalid or looping paths without hanging.

## Simulation Contract

The physics entry point is `simulateLaser(board, source, options)` from
`src/physics/laser.js`. The geometry entry point is
`src/physics/geometry.js`.

Board positions use integer `{ x, y }` coordinates, with `x` increasing to the
east/right and `y` increasing to the south/down. A board is shaped as follows:

```js
{
    width: number,
    height: number,
    walls: Array<{ x: number, y: number }>,
    mirrors: Array<{
        position: { x: number, y: number },
        orientation: "/" | "\\"
    }>,
    target: { x: number, y: number }
}
```

The source is `{ position: { x, y }, direction: "N" | "E" | "S" | "W" }`.
`simulateLaser` returns:

- `path`: in-board cells visited by the beam, including the source and mirror cells;
- `reflections`: mirror position, orientation, incoming direction (`from`), and outgoing direction (`to`);
- `terminal`: `{ reason, position, direction }`, where `reason` is `boundary`, `wall`, `target`, `loop`, or `step-limit`;
- `targetHit`: whether the target was entered; and
- `steps`: the number of attempted cell moves.

The target is checked when entered, before any mirror reflection in that cell.
Walls and out-of-bounds cells are reported as terminal collision positions but
are not added to `path`. Loop detection tracks both position and direction, so
revisiting a cell from a different direction remains valid.

For the diagonal reflection convention, an eastbound beam hitting `/` travels
north/up, while an eastbound beam hitting `\\` travels south/down. UI clients
must preserve this convention when converting `N`/`S` to screen rows.

## Validation

Add or update tests for every mirror orientation, straight travel, boundaries, walls, both documented 7×7 routes, correct target entry, wrong target entry direction, source re-entry, unreachable targets, and portal loops. Keep tests small and based on explicit board coordinates.

## Handoff

The current board-state and simulation contract is documented above for the
Level Agent and UI Agent. Do not edit their files unless a shared contract
requires a coordinated change.
