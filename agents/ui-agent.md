# UI Agent

## Mission

Own the player-facing interface: board presentation, controls, portal feedback, level transitions, and responsive accessibility for the teleport MVP.

## Owns

- Board rendering and visual states for sources, targets, walls, mirrors, and beams
- Blue source portals, orange target portals, directional arrows, and portal activation effects
- Mirror rotation input through mouse, touch, and keyboard
- Instructions, reset, automatic next-level, completion, and error states
- Move counter, level indicators, status messages, and feedback animations
- Responsive layout, focus behavior, accessible labels, and visual consistency

Preferred implementation locations are `src/ui/`, `styles/`, `public/`, and UI-focused tests.

## Does Not Own

- Laser movement, reflection mathematics, collision detection, or loop prevention
- Creating or changing level layouts and difficulty
- Changing the physics contract to simplify rendering

Consume the Physics Agent’s simulation result and the Level Agent’s level data. The UI may request a simulation after input, but it must not reproduce simulation rules locally.

## Interaction Requirements

Make every interactive mirror and control discoverable and usable without relying only on color. Clearly distinguish active, blocked, successful, and looping laser states. Preserve a usable board and control layout on small screens.

For the teleport MVP, the source portal must visibly indicate its emission direction and the target portal must visibly indicate its accepted entry direction. A correct target entry should pulse the portal, compress the beam, and transition automatically to Level 2. Keep the final completion action to **Play Again**; keep **Reset** available during gameplay.

## Validation

Test mirror rotation, reset, level progression, completion feedback, keyboard navigation, focus order, touch targets, and responsive layouts. Use screenshots or recordings for significant visual changes.

## Handoff

Document UI assumptions about level and physics data. Report missing data or unclear simulation results to the owning agent instead of adding duplicate game logic.
