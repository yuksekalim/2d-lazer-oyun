# Current Tasks

This is the practical MVP plan for the offline 2D laser mirror target game. Keep unfinished work visible here while active; move paused or partially completed work to `backlog.md`.

## MVP Scope Confirmed

- [x] One hand-designed 5×5 level
- [x] Fixed source, target, walls, and mirrors; only mirrors are interactive
- [x] Two diagonal mirror orientations with 90° click rotation
- [x] Hidden laser until **Fire Laser**
- [x] Cell-by-cell beam animation with controls disabled during playback
- [x] Three-life retry system, full Reset, and success actions
- [x] Offline static web game with no accounts or backend
- [x] No score, move counter, or Continue button in the MVP

## Foundation

- [ ] Choose the minimal web stack and create the static entry point.
- [ ] Add the project scripts and document actual local commands in `README.md`.
- [ ] Add source, level, test, and asset directories.

## Physics Agent

- [ ] Define grid coordinates, four movement directions, and mirror orientations.
- [ ] Implement deterministic beam tracing from the border source.
- [ ] Stop on walls and boundaries; detect target entry and repeating states.
- [ ] Return a structured result containing the path and terminal outcome.
- [ ] Test straight paths, both mirror orientations, collisions, target hits, misses, and loops.

## Level Agent

- [ ] Define the level-file schema and validation rules.
- [ ] Create one clear, hand-designed 5×5 level.
- [ ] Ensure the level has exactly one source and target and at least one verified solution.
- [ ] Keep the initial puzzle short and understandable without introducing advanced mechanics.

## UI Agent

- [ ] Render the 5×5 board and all fixed and interactive elements.
- [ ] Hide the beam until **Fire Laser** is pressed.
- [ ] Rotate mirrors by click/tap and animate the beam one cell at a time.
- [ ] Disable mirror and gameplay controls during beam playback.
- [ ] Display three lives and apply the defined failure/reset behavior.
- [ ] Add **Fire Laser**, **Reset**, **Play Again**, and success/failure feedback.
- [ ] Use simple geometric visuals with animation hooks that can support future polish.

## Integration and Verification

- [ ] Connect level data, physics results, and UI rendering without duplicating physics rules.
- [ ] Verify a successful solution, two retained-mirror failures, and third-failure reset.
- [ ] Verify Reset restores mirrors and three lives.
- [ ] Test the game in a modern desktop browser at common viewport sizes.
- [ ] Update `README.md` with the final stack and verified commands.

## Future, Not MVP

- [ ] Add multiple levels and the **Continue** flow.
- [ ] Add 8×8 and 11×11 boards.
- [ ] Introduce easy, medium, and hard level groups.
- [ ] Add custom art, sound, keyboard accessibility, and richer effects.
