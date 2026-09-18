# UI Agent

## Mission

Own the player-facing interface: board presentation, controls, portal feedback, level transitions, campaign overview, and desktop-first accessibility. The current runtime supports direct difficulty tabs and automatic progression through 30 authored levels; the overview and checkpoint flow are still pending.

## Owns

- Board rendering and visual states for sources, targets, walls, mirrors, and beams
- Blue source portals, orange target portals, directional arrows, and portal activation effects
- Mirror rotation input through mouse, touch, and keyboard
- Instructions, reset, automatic next-level, completion, and error states
- Level indicators, status messages, checkpoint feedback, and feedback animations
- Desktop-first layout with responsive fallback, focus behavior, accessible labels, and visual consistency

Preferred implementation locations are `src/ui/`, `styles/`, `public/`, and UI-focused tests.

## Does Not Own

- Laser movement, reflection mathematics, collision detection, or loop prevention
- Creating or changing level layouts and difficulty
- Changing the physics contract to simplify rendering

Consume the Physics Agent’s simulation result and the Level Agent’s level data. The UI may request a simulation after input, but it must not reproduce simulation rules locally.

For the current level format, load `levels/levels.json` as documented in
[`levels/README.md`](../levels/README.md). Render `obstacles` as wall cells,
initialize each mirror from its `orientation`, and use `rotatable` to decide
whether it is interactive. The authoring-only `solution` metadata must not be
shown as the player's starting state or as an automatic answer.

## Interaction Requirements

Make every interactive mirror and control discoverable and usable without relying only on color. Clearly distinguish active, blocked, successful, and looping laser states. Use the current light editorial palette: warm off-white background, dark ink, teal sources, orange targets, violet mirrors, and a pale teal board.

The top campaign selector is an ARIA `radiogroup` containing `radio` buttons.
Keep `aria-checked` synchronized with the active difficulty. Arrow keys move
between campaigns, while Home and End select the first and last campaign;
focus must remain visible. Preserve the responsive header and metadata layout
at narrower widths, and keep reduced-motion and forced-colors behavior intact.

For the completed teleport foundation, the source portal visibly indicates its emission direction and the target portal visibly indicates its accepted entry direction. A correct target entry activates target feedback and transitions automatically to the next level. **Reset** remains available during gameplay; completion currently offers replay and, for Easy/Medium, the next difficulty.

For the remaining campaign phase, show a difficulty screen first. After selection, render all 10 actual mini-grids in a desktop-first, read-only overview, then zoom into Level 1. Consecutive boards must visually connect according to their border portals and may turn without overlap. Implement checkpoint restart at Levels 1 and 6, restore three lives after Level 5, clear progress on refresh, and show **Play Again** plus **Choose Difficulty** after Level 10.

## Validation

Test mirror rotation, reset, level progression, completion feedback, keyboard navigation, focus order, desktop overview/zoom, checkpoint restarts, and campaign completion actions. Use screenshots or recordings for significant visual changes.

## Handoff

Document UI assumptions about level and physics data. Report missing data or unclear simulation results to the owning agent instead of adding duplicate game logic.
