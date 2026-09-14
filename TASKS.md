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

- [x] Choose the minimal web stack and create the static entry point.
- [x] Add the project scripts and document actual local commands in `README.md`.
- [x] Add source, level, test, and asset directories.

## Physics Agent

- [x] Define grid coordinates, four movement directions, and mirror orientations.
- [x] Implement deterministic beam tracing from the border source.
- [x] Stop on walls and boundaries; detect target entry and repeating states.
- [x] Return a structured result containing the path and terminal outcome.
- [x] Test straight paths, both mirror orientations, collisions, target hits, misses, and loops.

## Level Agent

- [x] Define the level-file schema and documented validation rules.
- [x] Create one clear, hand-designed 5×5 level.
- [x] Ensure the level has exactly one source and target and at least one verified solution.
- [x] Keep the initial puzzle short and understandable without introducing advanced mechanics.
- [ ] Add a dedicated runtime schema validator for level files.

## UI Agent

- [x] Render the 5×5 board and all fixed and interactive elements.
- [x] Hide the beam until **Fire Laser** is pressed.
- [x] Rotate mirrors by click/tap and animate the beam one cell at a time.
- [x] Disable mirror and gameplay controls during beam playback.
- [x] Display three lives and apply the defined failure/reset behavior.
- [x] Add **Fire Laser**, **Reset**, **Play Again**, and success/failure feedback.
- [x] Use simple geometric visuals with animation hooks that can support future polish.

## Integration and Verification

- [x] Connect level data, physics results, and UI rendering without duplicating physics rules.
- [ ] Verify a successful solution, two retained-mirror failures, and third-failure reset in a browser.
- [ ] Verify Reset restores mirrors and three lives in a browser.
- [ ] Test the game in a modern desktop browser at common viewport sizes.
- [x] Run the automated suite with `npm test` (17 tests passing).
- [x] Update `README.md` with the final stack and verified commands.

## Future, Not MVP

- [ ] Add multiple levels and the **Continue** flow.
- [ ] Add 8×8 and 11×11 boards.
- [ ] Introduce easy, medium, and hard level groups.
- [ ] Add custom art, sound, keyboard accessibility, and richer effects.
