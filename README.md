# 2D Laser Mirror Target

An offline browser puzzle game about routing a laser through a grid of mirrors. The player rotates mirrors, fires the laser, and tries to guide it to a target on the opposite part of the board.

## Game Vision

The game should feel simple to understand but satisfying to solve. Each puzzle presents a fixed board with a laser source, target, walls, and rotatable mirrors. The player studies the layout, makes adjustments without seeing the beam, then presses **Fire Laser** to watch the result unfold.

The first version is intentionally small: one hand-designed 5×5 level, simple geometric visuals, no accounts, no backend, and no scoring system. The architecture should still leave room for richer animation, effects, art, and more levels later.

## MVP Rules

- The source and target are fixed on border cells; the source emits inward.
- Walls and board boundaries stop the beam.
- Mirrors have two diagonal orientations, `/` and `\`, and rotate 90° per click.
- The laser travels up, down, left, or right and reflects 90° from mirrors.
- The beam is hidden until **Fire Laser** is pressed.
- The beam then animates cell by cell and remains visible after the attempt.
- Mirror clicks and gameplay controls are disabled during the animation.
- Any result that does not reach the target—including a wall, boundary, or loop—is a failed attempt.
- The player starts with three lives. The first two failures preserve mirror positions; the third restores the initial mirror layout and replenishes all three lives.
- **Reset** restores the initial mirror layout and three lives.
- On success, show **Play Again** and **Reset**. A **Continue** button is reserved for future multi-level releases.

Every level must have at least one correct solution and be deliberately uncomplicated for the MVP.

## Controls

- Click or tap a mirror to rotate it.
- Press **Fire Laser** to run the current attempt.
- Press **Reset** to restart the current puzzle.

## Future Direction

Add hand-designed level sets across 5×5, 8×8, and 11×11 boards, grouped into **easy**, **medium**, and **hard** difficulties. Later releases may add polished art, richer animations, sound, keyboard accessibility, and level progression.

## Local Development

The game is a self-contained static web project with no runtime dependencies or backend.

```bash
npm test
npm run dev
```

`npm test` runs the Node test suite. `npm run dev` starts a local static server; open `http://localhost:4173/src/ui/` in a modern browser.

## License

License: to be decided.
