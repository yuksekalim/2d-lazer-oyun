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

## Current board-state contract

The version 1 level data uses a top-left origin with `x` increasing right and
`y` increasing down. The emitter occupies a cell and the beam begins in the
next cell in its declared direction. Mirror orientations are `slash` and
`backslash`; `obstacles` are blocking wall cells; and the four board
boundaries are explicitly marked `blocked`. Keep this contract aligned with
[`levels/README.md`](../levels/README.md) when changing simulation behavior.

## Required Behavior

The simulation must be deterministic, independent of rendering and input, and able to explain its result through a structured response such as a beam path, terminal reason, and target-hit status. It must handle invalid or looping paths without hanging.

## Validation

Add or update tests for every mirror orientation, straight travel, boundaries, walls, target hits, unreachable targets, and repeated states. Keep tests small and based on explicit board coordinates.

## Handoff

Document any board-state or simulation API changes for the Level Agent and UI Agent. Do not edit their files unless a shared contract requires a coordinated change.
