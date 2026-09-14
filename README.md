# 2D Laser Mirror Target

A browser-based puzzle game where players rotate mirrors to guide a laser from its source to a target.

## Game Concept

Each level contains a laser source, a square board, walls, rotatable mirrors, and a target. The player wins by changing mirror orientations until the laser reaches the target without being blocked or trapped in a loop.

Supported board sizes are planned to include 5×5, 8×8, and 11×11 grids.

Starter content is available in [`levels/levels.json`](levels/levels.json),
with its version 1 format documented in [`levels/README.md`](levels/README.md).
The current set contains five beginner levels on 5×5 and 8×8 boards; its
`obstacles` field represents blocking wall cells.

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

## Local Development

The project is in its initial planning stage. The chosen web stack and canonical install, development, test, and build commands will be documented here once implementation begins.

## License

License: to be decided.
