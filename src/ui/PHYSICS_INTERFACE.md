# Physics handoff

The UI currently uses `simulatePlaceholder` from `physics-adapter.js` because the physics agent has not added an implementation yet. The adapter is deliberately kept in `src/ui/` and contains only precomputed demo paths for the presentation states.

The production adapter should expose:

```js
simulate(boardState) => {
    beamPath: [{ row, col }, ...],
    terminalReason: 'target' | 'boundary' | 'wall' | 'loop',
    targetHit: boolean,
    loopDetected: boolean,
}
```

`boardState` should include `size`, `source`, `target`, `walls`, and `mirrors`. Each mirror needs a stable `id`, `row`, `col`, and orientation value. The UI does not infer reflections, collisions, or loops; it renders the returned path and terminal state.

To connect the real engine, replace the `simulatePlaceholder` import in `app.js` with the physics agent's `simulate` function and pass it the same `boardState` object.
