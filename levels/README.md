# MVP level data

`levels.json` contains the authored teleport campaign. It is renderer-agnostic
and uses top-left origin coordinates: `x` increases east and `y` increases
south.

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

The campaign contains ten levels per difficulty: Easy uses 7×7 boards,
Medium uses 11×11 boards, and Hard uses 15×15 boards. The first three levels in
each difficulty are retained as the introductory set; levels 04–10 add longer
routes, denser wall fields, and several rotatable decoy mirrors that are not
visited by the intended route. The intended route is encoded in `solution` and
validated against the directional portal contract. New Easy levels require at
least eight solution-critical mirrors, new Medium levels at least eight, and
new Hard levels at least eighteen.

## Campaign continuity

Levels are independent boards; mirrors, beam state, and failed attempts are
not carried across a transition. Only the completed target edge determines the
next level's source portal:

| Completed target edge | Next source edge | Next source direction |
| --- | --- | --- |
| bottom | top, same column | `S` |
| top | bottom, same column | `N` |
| right | left, same row | `E` |
| left | right, same row | `W` |

The target portal's accepted travel direction identifies its edge (`S`, `N`,
`E`, or `W` respectively). The UI may animate the beam leaving the completed
portal and entering the next source, but the handoff is represented by source
and target placement in the level data.

## Validation

Run the dependency-free validator from the repository root after changing
level content:

```text
python3 levels/validate_levels.py
```

It checks the format, the three-by-ten campaign grouping, dimensions,
border-facing portal directions, unique occupied cells, legal mirror and wall
placement, complete solution metadata, target reachability, loop safety, the
presence of unused decoy mirrors, the increased complexity floor for levels
04–10, and every adjacent portal handoff.
