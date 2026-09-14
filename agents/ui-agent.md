# UI Agent

## Mission

Own the player-facing interface: board presentation, controls, portal feedback, level transitions, campaign overview, and desktop accessibility.

## Owns

- Board rendering and visual states for sources, targets, walls, mirrors, and beams
- Blue source portals, orange target portals, directional arrows, and portal activation effects
- Mirror rotation input through mouse, touch, and keyboard
- Instructions, reset, automatic next-level, completion, and error states
- Level indicators, status messages, checkpoint feedback, and feedback animations
- Desktop layout, focus behavior, accessible labels, and visual consistency

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

Make every interactive mirror and control discoverable and usable without relying only on color. Clearly distinguish active, blocked, successful, and looping laser states. Optimize the board and control layout for desktop screens; mobile support is out of scope.

For the teleport MVP, the source portal must visibly indicate its emission direction and the target portal must visibly indicate its accepted entry direction. A correct target entry should pulse the portal, compress the beam, and transition automatically to Level 2. Keep the final completion action to **Play Again**; keep **Reset** available during gameplay.

For the campaign phase, show a difficulty screen first. After selection, render all 15 actual mini-grids in a desktop-only, read-only overview, then zoom into Level 1. Consecutive boards must visually connect according to their border portals and may turn without overlap. Implement checkpoint restart at Levels 1, 6, and 11, restore three lives after Levels 5 and 10, clear progress on refresh, and show **Play Again** plus **Choose Difficulty** after Level 15.

## Validation

Test mirror rotation, reset, level progression, completion feedback, keyboard navigation, focus order, desktop overview/zoom, checkpoint restarts, and campaign completion actions. Use screenshots or recordings for significant visual changes.

## Handoff

Document UI assumptions about level and physics data. Report missing data or unclear simulation results to the owning agent instead of adding duplicate game logic.
