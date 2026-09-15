# 2D Laser Mirror Target

An offline browser puzzle game about routing a laser through a grid of mirrors and directional portals. The player rotates mirrors, fires the laser, and guides it into the correct target portal.

## Game Vision

The game should feel simple to understand but satisfying to solve. Each puzzle presents a fixed board with a source, portals, walls, and rotatable mirrors. The player studies the layout without seeing the beam, adjusts the mirrors, then presses **Fire Laser** to watch the route unfold.

The current teleport MVP is intentionally small: two hand-designed levels on a 7×7 board, simple geometric visuals, no accounts, no backend, and no scoring system. The planned full game will eventually contain Easy (7×7), Medium (11×11), and Hard (15×15) campaigns with 10 levels each, ending each campaign with a monster target.

## Campaign Progression Plan

The next phase expands the game into three independent campaigns. The player first sees a difficulty screen, then always starts that campaign at Level 1; there is no level-select screen. Each campaign contains 10 hand-designed levels: Easy uses 7×7 boards, Medium 11×11, and Hard 15×15. The game is desktop-only, with a fixed overview layout sized to show all 10 real boards.

Before Level 1 begins, the selected campaign appears as a connected overview of its actual mini-grids, including mirrors, walls, and portals. The camera then zooms into Level 1. A target portal on a non-corner border cell determines the next level's source portal on the opposite border at the same row or column: bottom→top, top→bottom, right→left, or left→right. The overview route may turn and must not overlap boards; level data should provide any authored overview placement needed to guarantee this.

Each campaign has one shared pool of three lives. Completing Level 5 activates a checkpoint and restores three lives; completing Level 10 completes the campaign. Losing all lives on Levels 1–5 restarts at Level 1, and on Levels 6–10 at Level 6. A page refresh clears the selected difficulty, lives, and checkpoint progress. Completing Level 10 shows a completion message with **Play Again** and **Choose Difficulty**.

## Teleport MVP Rules

Level content is documented in [`levels/README.md`](levels/README.md), and the
runtime currently uses the format-2 teleport schema.

- The MVP starts directly at Easy Level 1; difficulty selection and the 10-level campaign flow are the next phase.
- Both levels use a 7×7 board, three rotatable mirrors, and fixed walls. Level 1 has two walls; Level 2 has four.
- Level 1 uses the existing laser emitter and one orange target portal. Level 2 uses a blue source portal and an orange target portal. There are never more than two portals in a level.
- Level 1’s target portal at `(1, 6)` continues into Level 2’s blue source portal at `(1, 0)`, which emits downward in the same column. Each level still has its own mirror layout.
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

Implement the 10-level Easy, Medium, and Hard campaigns using the progression rules above. Later releases may add the monster target at level 10, richer portal effects, sound, and persistent progress.

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

The game is a self-contained static web project with no runtime dependencies or backend.

```bash
npm test
node --test tests/physics/*.test.js
npm run dev
```

`npm test` runs the full Node test suite. The direct physics command is useful
when working only on `src/physics/`. `npm run dev` starts a local static server;
open `http://localhost:4173/src/ui/` in a modern browser.

## License

License: to be decided.
