# 2D Laser Mirror Target

An offline browser puzzle game about routing a laser through a grid of mirrors and directional portals. The player rotates mirrors, fires the laser, and guides it into the correct target portal.

## Game Vision

The game should feel simple to understand but satisfying to solve. Each puzzle presents a fixed board with a source, portals, walls, and rotatable mirrors. The player studies the layout without seeing the beam, adjusts the mirrors, then presses **Fire Laser** to watch the route unfold.

The current teleport MVP is intentionally small: two hand-designed levels on a 7×7 board, simple geometric visuals, no accounts, no backend, and no scoring system. The planned full game will eventually contain Easy (7×7), Medium (11×11), and Hard (15×15) campaigns with 15 levels each, ending each campaign with a monster target.

## Teleport MVP Rules

- The MVP starts directly at Easy Level 1; difficulty selection is deferred.
- Both levels use a 7×7 board, three rotatable mirrors, and fixed walls. Level 1 has two walls; Level 2 has four.
- Level 1 uses the existing laser emitter and one orange target portal. Level 2 uses a blue source portal and an orange target portal. There are never more than two portals in a level.
- Portals are fixed on border cells and face perpendicular to the border. A blue source portal emits inward; an orange target portal accepts a beam traveling in its facing direction. Small arrows show both directions.
- Walls and board boundaries stop the beam.
- Mirrors have two diagonal orientations, `/` and `\`, and rotate 90° per click.
- The laser travels up, down, left, or right and reflects 90° from mirrors.
- The beam is hidden until **Fire Laser** is pressed.
- The beam animates cell by cell. A failed beam remains visible for about 1–2 seconds, then hides for the next attempt.
- Mirror clicks and gameplay controls are disabled during the animation.
- Any result that does not enter the orange target portal from the correct direction—including a wall, boundary, wrong-direction portal entry, or loop—is a failed attempt. The blue source portal is never a valid target.
- The player has one shared pool of three lives. Remaining lives carry from Level 1 into Level 2. Losing all lives restarts Level 1 with three lives and each level’s own initial mirror layout.
- The first two failures preserve the current level’s mirror positions. The in-game **Reset** button restores only the current level’s initial mirror positions without costing a life.
- A successful target entry briefly pulses the portal, compresses the beam into it, and automatically loads the next level. After Level 2, show a completion message with **Play Again**, which restarts Level 1 with three lives.

Every level must have at least one correct solution and be deliberately uncomplicated for the MVP.

## Controls

- Click or tap a mirror to rotate it.
- Press **Fire Laser** to run the current attempt.
- Press **Reset** to restore the current level’s original mirror positions.

## Future Direction

Add the 15-level Easy, Medium, and Hard campaigns on 7×7, 11×11, and 15×15 boards. Later releases may add the monster target at level 15, richer portal effects, sound, keyboard accessibility, and progression controls.

## Local Development

The game is a self-contained static web project with no runtime dependencies or backend.

```bash
npm test
npm run dev
```

`npm test` runs the Node test suite. `npm run dev` starts a local static server; open `http://localhost:4173/src/ui/` in a modern browser.

## License

License: to be decided.
