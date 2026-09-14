# MVP level data

`levels.json` is the first level-data format. It is intentionally small and
renderer-agnostic so the game can load it without coupling level content to
laser physics or UI code.

## Format version 1

The root object contains `formatVersion` and a `levels` array. Each level has:

- `id` and `name` — stable content identifiers and a player-facing title.
- `board.width` and `board.height` — dimensions in cells. Coordinates use an
  origin at the top-left; `x` increases right and `y` increases down.
- `board.boundaries` — the four edges. `blocked` means the beam stops when it
  tries to leave the board.
- `emitter.position` and `emitter.direction` — the source cell and initial
  direction (`north`, `east`, `south`, or `west`). The beam starts in the next
  cell in that direction.
- `target.position` — the cell that completes the level when the beam enters it.
- `mirrors` — cells containing a rotatable mirror. MVP mirrors have two states:
  `slash` (`/`) and `backslash` (`\\`). `orientation` is the initial state and
  `rotatable` indicates whether the player may change it.
- `obstacles` — optional cells that stop the beam before it can pass through.
- `solution` — optional authoring metadata listing the final orientation for
  each mirror in an intended solution. It is not required at runtime.

All occupied cells are unique. A level is solvable when its mirrors can be
rotated from their initial orientations to the orientations in `solution` and
the resulting beam enters the target before hitting an obstacle or boundary.

## Mirror directions

| Orientation | Reflections |
| --- | --- |
| `slash` (`/`) | north → east, east → north, south → west, west → south |
| `backslash` (`\\`) | north → west, west → north, south → east, east → south |

The five included levels progress from one-turn 5×5 layouts to a four-turn
8×8 layout. The intended solutions are recorded in each level's `solution`
array for content review and future hint support.
