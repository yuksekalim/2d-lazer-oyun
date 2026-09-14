# MVP level data

`levels.json` contains the two authored teleport MVP levels. It is
renderer-agnostic and uses top-left origin coordinates: `x` increases east and
`y` increases south.

## Format version 2

Each level contains:

- `board.width`, `board.height`, and four blocked `boundaries`.
- `source` with `role` (`emitter` or `portal`), `position`, and cardinal
  `direction`. A portal source also has `portalId` and `color`.
- `portals`, with at most one `source` and one `target`. Each portal has an
  `id`, `role`, `position`, cardinal `direction`, and `color`.
- `target.portalId`, identifying the orange target portal.
- `mirrors`, each with an `id`, position, initial `orientation` (`slash` or
  `backslash`), and `rotatable: true`.
- `obstacles`, which are fixed wall cells.
- `solution`, authoring metadata listing the final orientation of every mirror.

Portals sit on the border and face perpendicular to it. A source points into
the board; a target’s direction is the exact direction a beam must travel when
entering it. The target cell alone is not sufficient for success.

The MVP levels each use a 7×7 board, three rotatable mirrors, and an intended
solution route documented in `agents/level-agent.md`.

## Validation

Run the dependency-free validator from the repository root after changing
level content:

```text
python3 levels/validate_levels.py
```

It checks the format, dimensions, border-facing portal directions, unique
occupied cells, legal mirror and wall placement, complete solution metadata,
and target reachability.
