# 2D Laser Mirror Target

A browser-based puzzle game where players rotate mirrors to guide a laser from its source to a target.

## Game Concept

Each level contains a laser source, a square board, walls, rotatable mirrors, and a target. The player wins by changing mirror orientations until the laser reaches the target without being blocked or trapped in a loop.

Supported board sizes are planned to include 5×5, 8×8, and 11×11 grids.

## Gameplay

1. Inspect the board and the initial laser path.
2. Click or tap a mirror to rotate it.
3. Observe the updated laser beam.
4. Continue adjusting mirrors until the target is hit.
5. Complete the level in as few moves as possible.

## Board Elements

- **Laser source** — emits the laser beam in a fixed direction.
- **Mirror** — reflects the beam according to its orientation.
- **Wall** — blocks the laser and cannot be traversed.
- **Target** — the destination that completes the level.
- **Empty cell** — allows the laser to pass through.

## Controls

- Click or tap a mirror to rotate it.
- Use **Reset** to restore the level’s original layout.
- Keyboard controls and accessibility support will be added during development.

## Planned Features

- Multiple board sizes and progressively harder levels
- Move counter and level progression
- Reset and next-level controls
- Animated laser reflection and collision feedback
- Responsive desktop and mobile layout
- Optional sound effects

## Physics MVP

The deterministic laser simulation is available from `src/physics/laser.js` and
uses the geometry helpers in `src/physics/geometry.js`. It accepts a board and
source in grid coordinates:

```js
const board = {
    width: 5,
    height: 5,
    walls: [{ x: 3, y: 2 }],
    mirrors: [{ position: { x: 2, y: 2 }, orientation: "/" }],
    target: { x: 2, y: 0 },
};
const source = { position: { x: 0, y: 2 }, direction: "E" };
```

Coordinates use `x` increasing east/right and `y` increasing south/down. The
simulation returns the visited `path`, `reflections`, `terminal` reason, and
`targetHit` status. A slash mirror sends an eastbound beam north/up; a
backslash mirror sends it south/down.

## Local Development

Run the physics tests with Node's built-in test runner:

```sh
node --test tests/physics/*.test.js
```

The browser entry point and build workflow will be documented when the UI and
project toolchain are finalized.

## License

License: to be decided.
