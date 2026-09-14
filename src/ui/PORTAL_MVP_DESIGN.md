# Teleport MVP UI design pass

This document records the UI decisions required before the teleport MVP runtime is edited. It is intentionally implementation-neutral: the UI renders portal metadata and physics results; it does not infer portal behavior.

## Visual language

- Blue/cyan portals are sources. Use `#61e5e6` for the ring, core glow, and emission arrow.
- Orange portals are targets. Use `#ffb65c` for the ring, core glow, and acceptance arrow.
- Portal role must never be communicated by color alone. The source uses a filled center and an inward arrow; the target uses a ringed center and an entry arrow. Accessible text names the role and direction.
- Keep walls and the board grid in the existing low-contrast slate palette so portals and the beam remain the visual focus.
- A source portal remains visually active while the player is aiming. A target portal receives a brighter halo only after a valid target-entry result.

## Direction arrows

Portal arrows are data-driven and must not be inferred from the cell’s row or column:

- Source arrow: points in the exact direction emitted by the source portal.
- Target arrow: points in the exact direction required by the target portal’s `facingDirection` / accepted beam direction.
- Render the arrow inside the portal cell with a small tail and triangular head. Keep it visible at rest, during aiming, and while the beam is hidden.
- Add a text equivalent to every arrow, for example: `Blue source portal, emits east` and `Orange target portal, accepts north`.

## Feedback and timing

| State | Visual behavior | Input behavior |
| --- | --- | --- |
| Aiming | Beam hidden; portals show their role and arrows | Mirrors, Fire Laser, and Reset available |
| Beam playback | Beam reveals one traversed cell at a time; source emits a short blue pulse | Mirrors, Fire Laser, and Reset disabled |
| Failed result | Beam remains visible for about 1.4 seconds; terminal cell gets a brief amber/red interruption pulse; beam then hides | Controls re-enable after the beam is hidden |
| Valid target entry | Beam compresses into the orange portal over about 220ms; target portal pulses for about 720ms | Controls remain disabled during feedback |
| Level transition | After the target pulse, update the level label and render the next board with the shared life count intact | New level starts in aiming state |
| Final success | After Level 2, show a completion dialog with **Play Again** only | Play Again restarts Level 1 and restores three lives |

The animation module should expose cancellation so Reset cannot leave a stale timer or portal effect running. The UI should use the physics path and terminal result as the only source of truth for beam playback and success/failure.

## Accessible labels and live status

- Source portal: `Blue source portal at row {row}, column {col}; emits {direction} into the board.`
- Target portal: `Orange target portal at row {row}, column {col}; accepts a beam traveling {direction}.`
- During playback, announce `Laser in transit.` and do not announce every cell.
- On failure, announce the terminal reason in plain language: `Attempt failed: beam hit a wall.` / `beam left the board.` / `beam entered a portal in the wrong direction.` / `beam looped.`
- On success, announce `Target portal reached. Loading the next level.`
- Keep the three-heart life pool in one `aria-live="polite"` region. The same shared count must remain visible across both levels.

## Required handoff contracts

The UI is ready to consume normalized level data shaped like:

```js
{
    id,
    name,
    size: 7,
    source: { row, col, role: 'source', direction },
    target: { row, col, role: 'target', facingDirection },
    portals: [
        { id, role: 'source' | 'target', row, col, facingDirection },
    ],
    walls: [{ row, col }],
    mirrors: [{ id, row, col, orientation: '/' | '\\', rotatable: true }],
}
```

The physics result needs to preserve the existing path/terminal shape and expose enough terminal data for portal feedback:

```js
{
    beamPath: [{ row, col }, ...],
    targetHit: boolean,
    terminalReason: 'target' | 'boundary' | 'wall' | 'wrong-portal-direction' | 'source-reentry' | 'loop',
    terminal: { position: { row, col }, direction, portalId? },
}
```

## Level and route gate

Runtime UI work must wait for the Level Agent to provide the final two 7×7 portal levels. The current repository level file still contains the earlier non-portal content, so no coordinates or solution routes are copied into the UI as guesses.

Before implementation starts, record here (or in the level handoff) for each level:

| Level | Source portal | Target portal | Mirrors | Walls | Intended route |
| --- | --- | --- | --- | --- | --- |
| Easy 1 | Pending Level Agent | Pending Level Agent | Pending | Pending | Pending physics verification |
| Easy 2 | Pending Level Agent | Pending Level Agent | Pending | Pending | Pending physics verification |

The Physics Agent must also confirm the target-entry direction convention and provide a verified result for: both successful routes, wrong-direction target entry, source re-entry, walls, boundaries, and loops. Once those handoffs land, the UI runtime can be updated without duplicating teleport or reflection rules.
