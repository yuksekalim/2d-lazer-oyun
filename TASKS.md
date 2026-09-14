# Current Tasks

This file tracks active implementation work for the 2D laser mirror target game. Move completed items to a changelog or remove them when the corresponding milestone is finished.

## MVP: Project Foundation

- [ ] Choose the web stack and define the project entry point.
- [ ] Add the initial HTML, CSS, and JavaScript structure.
- [ ] Create a responsive square board component.
- [ ] Add a minimal development and test command to `README.md`.

## MVP: Board and Game State

- [ ] Define board sizes for 5×5, 8×8, and 11×11 grids.
- [ ] Define level data for the laser source, target, walls, mirrors, and empty cells.
- [ ] Render each board element from game state.
- [ ] Validate that levels contain one source and one target.

## MVP: Laser Simulation

- [ ] Trace the laser one cell at a time from its source.
- [ ] Stop the beam at board boundaries and walls.
- [ ] Implement reflection for each supported mirror orientation.
- [ ] Detect target hits and display a completed state.
- [ ] Detect repeated positions and prevent infinite laser loops.
- [ ] Add deterministic tests for movement, reflection, collisions, and loops.

## MVP: Player Interaction

- [ ] Rotate mirrors by click and touch input.
- [ ] Recalculate the beam after each rotation.
- [ ] Add a move counter and reset control.
- [ ] Prevent rotation of fixed board elements.

## Polish and Content

- [ ] Create tutorial levels for each board size.
- [ ] Add level completion and progression.
- [ ] Add laser, reflection, wall, and target visual states.
- [ ] Add keyboard navigation and accessible labels.
- [ ] Test responsive layouts on desktop and mobile.
- [ ] Decide on sound effects, license, and deployment target.
