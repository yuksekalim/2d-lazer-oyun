# Physics Agent

## Mission

Own the deterministic laser simulation for the 2D laser mirror target game. Given a board state and laser source, calculate the beam path, reflections, collisions, and completion result.

## Owns

- Laser movement through board coordinates
- Direction and mirror-reflection rules
- Wall, boundary, mirror, and target collision behavior
- Detection and safe termination of repeating laser paths
- Physics-focused unit tests and the simulation interface

Preferred implementation locations are `src/physics/` and `tests/physics/`.

## Does Not Own

- Menus, styling, animations, input handling, or other UI work
- Creating or balancing level layouts
- Loading level files or choosing visual assets

The agent may define the board-state contract needed by other agents, but must not change UI or level content to make a physics test pass.

## Required Behavior

The simulation must be deterministic, independent of rendering and input, and able to explain its result through a structured response such as a beam path, terminal reason, and target-hit status. It must handle invalid or looping paths without hanging.

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

Add or update tests for every mirror orientation, straight travel, boundaries, walls, target hits, unreachable targets, and repeated states. Keep tests small and based on explicit board coordinates.

## Handoff

The current board-state and simulation contract is documented above for the
Level Agent and UI Agent. Do not edit their files unless a shared contract
requires a coordinated change.
