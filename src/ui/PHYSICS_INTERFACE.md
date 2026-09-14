# Physics handoff

The UI consumes the production physics implementation from `src/physics/` through
`physics-adapter.js`. It does not reproduce reflection, collision, portal, or loop
rules. The adapter converts the level format's top-left `{ x, y }` coordinates to
the renderer's `{ row, col }` coordinates and converts them back before simulation.

The runtime integration expects the physics and levels branches to be merged with
this UI branch:

- `src/physics/geometry.js` exports `DIRECTIONS` and `MIRROR_ORIENTATIONS`.
- `src/physics/laser.js` exports `simulateLaser(board, source)`.
- `levels/levels.json` contains the nine format-version-2 campaign levels.

The UI-facing adapter exposes:

```js
simulate(boardState) => {
    beamPath: [{ row, col }, ...],
    reflections: [{ position, orientation, from, to }, ...],
    portalEvents: [{ type, portalId, position, direction, accepted? }, ...],
    terminalReason: 'target' | 'boundary' | 'wall' | 'wrong-target-direction'
        | 'source-reentry' | 'loop' | 'portal-loop' | 'step-limit',
    terminal: { reason, position, direction, portalId? },
    targetHit: boolean,
    loopDetected: boolean,
}
```

`boardState` includes `size`, `source`, `target`, `portals`, `walls`, and
`mirrors`. Each mirror has a stable `id`, `{ row, col }`, an orientation of `/`
or `\\`, and its current state. The solution metadata is used only by authored
level validation and is never used by the UI to reveal an answer.
