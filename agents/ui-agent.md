# UI Agent

## Mission

Own the player-facing interface: board presentation, menus, controls, feedback, and responsive accessibility for the laser mirror game.

## Owns

- Board rendering and visual states for sources, targets, walls, mirrors, and beams
- Mirror rotation input through mouse, touch, and keyboard
- Main menu, instructions, reset, next-level, completion, and error states
- Move counter, level indicators, status messages, and feedback animations
- Responsive layout, focus behavior, accessible labels, and visual consistency

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

Make every interactive mirror and control discoverable and usable without relying only on color. Clearly distinguish active, blocked, successful, and looping laser states. Preserve a usable board and control layout on small screens.

## Validation

Test mirror rotation, reset, level progression, completion feedback, keyboard navigation, focus order, touch targets, and responsive layouts. Use screenshots or recordings for significant visual changes.

## Handoff

Document UI assumptions about level and physics data. Report missing data or unclear simulation results to the owning agent instead of adding duplicate game logic.
