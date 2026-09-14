# Physics handoff

The UI consumes the deterministic adapter in `physics-adapter.js`. The adapter
translates row/column UI cells into the physics engine's `{ x, y }` grid,
where `x` increases right and `y` increases down. It must not reproduce laser
movement, reflection, collision, target-direction, or loop rules.

The adapter exposes:

```js
simulate(boardState) => {
    beamPath: [{ row, col }, ...],
    reflections: [{ position: { row, col }, from, to, orientation }, ...],
    portalEvents: [{ type, portalId, color, position, direction, accepted? }, ...],
    terminalReason:
        'target' | 'boundary' | 'wall' | 'wrong-target-direction'
        | 'source-reentry' | 'loop' | 'portal-loop' | 'step-limit',
    terminal: { reason, position: { row, col }, direction, portalId? },
    targetHit: boolean,
    loopDetected: boolean,
}
```

`boardState` includes `size`, `source`, `target`, `portals`, `walls`, and
`mirrors`. A portal has a stable `id`, `role`, border cell, facing direction,
and visual color. The blue source portal emits from its own cell; the orange
target portal succeeds only when entered from its configured direction.

Portal events are returned separately so animations can react to
`source-emit`, `source-enter`, and `target-enter` without duplicating physics.
The canonical engine contract and mirror convention are documented in
`agents/physics-agent.md`.
