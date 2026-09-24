# Teleport campaign UI design pass

This document records the UI decisions for the teleport campaign. It is
implementation-neutral about physics: the UI renders portal metadata and
physics results; it does not infer portal behavior. It describes both the
current direct-tab runtime and the remaining overview/checkpoint experience.

The current data set contains three independent difficulties with ten levels
each. Easy uses 7×7 boards, Medium uses 11×11 boards, and Hard uses 15×15
boards. The current runtime starts on Easy Level 1, allows direct difficulty
tab switching, and gives each selected campaign three lives. A valid target
entry advances automatically through Levels 1 → 10; completing Easy or Medium
offers the next difficulty, while every difficulty offers replay. The separate
difficulty screen, connected overview, checkpoint restart, and **Choose
Difficulty** action are not implemented yet.

## Visual language

- The current interface uses a light editorial palette: `#f1f0ea` warm off-white background, `#13232b` dark ink, white and pale-green surfaces, and teal grid accents.
- Blue/cyan portals are sources. The current source accent is `#087d86` for the ring, core glow, and emission arrow.
- Orange portals are targets. The current target accent is `#bd681f` for the ring, core glow, and acceptance arrow.
- Mirrors use violet `#6552b3`; walls and cells use a pale teal board palette (`#d8e4e3`) with low-contrast grid lines.
- Portal role must never be communicated by color alone. The source uses a filled center and an inward arrow; the target uses a ringed center and an entry arrow. Accessible text names the role and direction.
- A source portal remains visually active while the player is aiming. A target portal receives a brighter halo only after a valid target-entry result.

The header centers a `SELECT A CAMPAIGN` label above the Easy/Medium/Hard
selector and shows `CAMPAIGN ONLINE` with the current level on the right. The
selector is a keyboard-operable ARIA radio group. The board metadata visibly
labels `LIVES`, level progress, level name, and grid size; the intro panel also
shows the 30-route, three-difficulty, unlimited-retry campaign facts. The
header and metadata stack responsively on narrower screens.

## Direction arrows

Portal arrows are data-driven and must not be inferred from the cell’s row or column:

- Source arrow: points in the exact direction emitted by the source portal.
- Target arrow: points in the exact direction required by the target portal’s `facingDirection` / accepted beam direction.
- Render the arrow inside the portal cell with a small tail and triangular head. Keep it visible at rest, during aiming, and while the beam is hidden.
- Add a text equivalent to every arrow, for example: `Blue source portal, emits right` and `Orange target portal, accepts up`.

## Feedback and timing

| State | Visual behavior | Input behavior |
| --- | --- | --- |
| Aiming | Beam hidden; portals show their role and arrows | Mirrors, Fire Laser, and Reset available |
| Beam playback | Beam reveals one traversed cell at a time; the source and portal remain visible | Mirrors, Fire Laser, and Reset disabled |
| Failed result | Beam remains visible for about 1.4 seconds; the status card reports the terminal reason; terminal-cell interruption pulse remains future polish | Controls re-enable after the beam is hidden |
| Valid target entry | Target portal feedback plays for about 720ms; beam compression remains a future polish item | Reset, mirrors, Fire Laser, and difficulty selection remain disabled during feedback |
| Level transition | After the target pulse, update the level label and render the next board with the shared life count intact | New level starts in aiming state |
| Difficulty completion | After Level 10, show a completion dialog; Easy and Medium offer **Next difficulty**, all difficulties offer replay | Next difficulty starts its Level 1 with three lives; replay restarts the selected difficulty |
| Campaign completion | After Hard Level 10, show a completion dialog with **Play Again** | Play Again restarts Hard Level 1 with three lives |

The animation module should expose cancellation so Reset cannot leave a stale timer or portal effect running. The UI should use the physics path and terminal result as the only source of truth for beam playback and success/failure.

Remaining UI work is the initial difficulty screen, the read-only overview of
actual mini-grids, the overview-to-board zoom transition, Level 5 checkpoint
state, Level 1/6 segment restarts, refresh reset behavior, and the final
**Choose Difficulty** action.

## Accessible labels and live status

- Source portal: `Blue source portal at row {row}, column {col}; emits {direction} into the board.`
- Target portal: `Orange target portal at row {row}, column {col}; accepts a beam traveling {direction}.`
- During playback, announce `Laser in transit.` and do not announce every cell.
- On failure, announce the terminal reason in plain language: `Attempt failed: beam hit a wall.` / `beam left the board.` / `beam entered a portal in the wrong direction.` / `beam looped.`
- On success, announce `Target portal reached. Loading the next level.`
- Keep the three-heart life pool in one `aria-live="polite"` region. The same shared count must remain visible across both levels.
- Keep `aria-checked` synchronized on the difficulty radio buttons. Arrow keys navigate the selector, and Home/End jump to the first/last option.
- Preserve visible focus indicators for mirrors, controls, and difficulty options. Support reduced-motion and forced-colors modes.

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
    terminalReason: 'target' | 'boundary' | 'wall' | 'wrong-target-direction' | 'source-reentry' | 'loop' | 'portal-loop' | 'step-limit',
    terminal: { position: { row, col }, direction, portalId? },
}
```

## Level and route handoff

The runtime reads the Level Agent's format-version-2 data directly from
`levels/levels.json`. It renders every authored source portal, target portal,
wall, and mirror dynamically across all thirty boards. The target edge and
accepted direction are data-driven; the UI does not copy coordinates or
solution routes into its own fixtures.

The level validator confirms the thirty levels, their target reachability, and
portal handoffs in the ordered data file. The runtime treats the three
difficulties as independent and traverses only the nine handoffs within the
selected difficulty. The physics adapter passes each level to the production
simulator and exposes the returned path and terminal result to the animation
layer.
