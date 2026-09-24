# 2D Laser Mirror Target

An offline browser puzzle game about routing a laser through a grid of mirrors and directional portals. The player rotates mirrors, fires the laser, and guides it into the correct target portal.

The current runtime contains three independent campaigns with ten authored
levels each. The game starts on Easy Level 1 and exposes Easy, Medium, and
Hard as direct difficulty tabs. The campaign overview, initial difficulty
screen, and checkpoint flow described below are planned work rather than
current runtime behavior.

## Game Vision

The game should feel simple to understand but satisfying to solve. Each puzzle presents a fixed board with a source, portals, walls, and rotatable mirrors. The player studies the layout without seeing the beam, adjusts the mirrors, then presses **Fire Laser** to watch the route unfold.

The completed teleport MVP established the deterministic laser, directional
portal, life, reset, and animation foundations. Those foundations now power
the 30-level campaign data set. The game remains offline, uses simple
geometric visuals, and has no accounts, backend, scoring system, or move
counter.

## Campaign Progression Plan

The following is the target campaign experience. The level data, direct
difficulty switching, automatic level progression, and campaign completion
overlay are implemented; the overview and checkpoint portions remain to be
implemented.

The next phase expands the game into three independent campaigns. The player first sees a difficulty screen, then always starts that campaign at Level 1; there is no level-select screen. Each campaign contains 10 hand-designed levels: Easy uses 7×7 boards, Medium 11×11, and Hard 15×15. The game is desktop-first, with a responsive fallback for narrower screens and a fixed overview layout sized to show all 10 real boards.

Before Level 1 begins, the selected campaign should appear as a connected overview of its actual mini-grids, including mirrors, walls, and portals. The camera should then zoom into Level 1. A target portal on a non-corner border cell determines the next level's source portal on the opposite border at the same row or column: bottom→top, top→bottom, right→left, or left→right. The overview route may turn and must not overlap boards; level data should provide any authored overview placement needed to guarantee this.

Each campaign has one shared pool of three lives. Completing Level 5 activates a checkpoint and restores three lives; completing Level 10 completes the campaign. Losing all lives on Levels 1–5 restarts at Level 1, and on Levels 6–10 at Level 6. A page refresh clears the selected difficulty, lives, and checkpoint progress. Completing Level 10 shows a completion message with **Play Again** and **Choose Difficulty**.

## Current Runtime Rules

Level content is documented in [`levels/README.md`](levels/README.md), and the
runtime currently uses the format-2 teleport schema with 30 campaign levels.

- The game starts at Easy Level 1. Easy, Medium, and Hard can currently be selected directly from the difficulty tabs; there is not yet a separate difficulty screen.
- Easy levels use 7×7 boards, Medium levels use 11×11 boards, and Hard levels use 15×15 boards. Each campaign contains ten levels.
- The current UI uses a light editorial palette: warm off-white background, dark ink, teal source accents, orange target accents, violet mirrors, and a pale teal board.
- The current screen is board-first: the compact header contains the ARIA difficulty radio group, a route/lives ribbon sits above the centered board, and Fire Laser/Reset actions sit below it. The former intro and side-rail panels are not part of the runtime.
- Level name and grid size appear above the board; the receiver’s required entry direction remains visible through the target arrow and accessible portal label. A compact status row appears only when a terminal result needs explanation.
- The three-life pool and route progress remain visible in the ribbon, which stacks responsively on narrower screens. Filled and empty lives use the same inline vector-heart geometry.
- Every authored campaign level has one blue source portal and one orange target portal. There are never more than two portals in a level.
- Portals are fixed on border cells and face perpendicular to the border. A blue source portal emits inward; an orange target portal accepts a beam traveling in its facing direction. Small arrows show both directions.
- Walls and board boundaries stop the beam.
- Mirrors have two diagonal orientations, `/` and `\`, and rotate 90° per click.
- The laser travels up, down, left, or right and reflects 90° from mirrors.
- The beam is hidden until **Fire Laser** is pressed.
- The beam travels continuously along the traced path with a moving tip rather than revealing one whole cell at a time. Reduced-motion mode completes the route immediately. A failed beam remains visible for about 1.4 seconds, then hides for the next attempt.
- Mirror clicks and gameplay controls are disabled during the animation.
- Any result that does not enter the orange target portal from the correct direction—including a wall, boundary, wrong-direction portal entry, or loop—is a failed attempt. The blue source portal is never a valid target.
- The player has one shared pool of three lives within the selected campaign. Lives carry between levels; losing all lives currently restarts that campaign at Level 1 with three lives. Checkpoint restarts at Level 6 are not implemented yet.
- Failed attempts preserve the current level’s mirror positions. The in-game **Reset** button restores only the current level’s initial mirror positions without costing a life.
- A successful target entry activates target feedback and automatically loads the next level. Completing Level 10 shows a completion message; Easy and Medium offer the next difficulty, while every difficulty offers replay. **Choose Difficulty** is not implemented yet.

Every authored level has at least one validated solution. The campaign
validator also enforces decoys, wrong-turn branches, portal continuity, and
increasing difficulty constraints.

The original two-level teleport MVP layouts and their three-mirror routes are
preserved in the agent notes as historical foundation material, not as the
current campaign content.

## Controls

- Click or tap a mirror to rotate it.
- Press **Fire Laser** to run the current attempt.
- Press **Reset** to restore the current level’s original mirror positions.
- Press **Enter** to fire when focus is not on a button or link; press **R** to reset.

## Remaining Campaign Work

Implement the difficulty screen, connected mini-grid overview, zoom
transition, Level 5 checkpoint, Level 1/6 segment restarts, refresh semantics,
and **Choose Difficulty** completion action. Later releases may add the monster
target at level 10, richer portal effects, sound, and persistent progress.

## Physics Contract

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
