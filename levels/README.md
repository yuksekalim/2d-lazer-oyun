# Campaign level data

`levels.json` contains the 30 authored teleport campaign levels. It is
renderer-agnostic and uses top-left origin coordinates: `x` increases east and
`y` increases south. The runtime groups the levels into independent Easy,
Medium, and Hard campaigns.

## Format version 2

Each level contains:

- `board.width`, `board.height`, and four blocked `boundaries`.
- `source` with `role` (`portal` in the current campaign; legacy `emitter`
  data is still supported by the physics adapter), `position`, and cardinal
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
Medium uses 11×11 boards, and Hard uses 15×15 boards. The authored boards use
different route seeds and spatial motifs, with increasing route length, wall
pressure, and decoy density by difficulty. Every level has multiple
solution-critical mirrors, rotatable decoys that are not visited by the
intended route, and meaningful wrong-turn branches. The intended route is
encoded in `solution` and validated against the directional portal contract.
The validator also checks the authored initial-orientation ratio and route
uniqueness constraints.
Target portal cells and complete solution turn signatures do not repeat within
the same difficulty band. Critical mirrors are also kept sparse within a
Chebyshev-2 neighborhood of the source and target (at most three critical
mirrors), so the opening and finish do not become a single cluster of obvious
moves. The validator also rejects repeated turn-direction motifs of twelve or
more decisions.

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
04–10, the initial critical-mirror ratio, at least two meaningful wrong-turn
branches per level, portal-neighborhood density, unique target cells and route
signatures, and every adjacent portal handoff in the ordered data file.

The runtime treats the three difficulties as independent campaigns and only
traverses the nine handoffs within the selected difficulty. Overview placement
metadata, checkpoint markers, and the connected overview renderer are not part
of the current schema yet; they remain tracked in `TASKS.md`.
