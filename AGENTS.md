# Repository Guidelines

## Project Structure & Module Organization

Keep runtime code under `src/`, static resources under `assets/`, and automated tests under `tests/`. Organize source by responsibility or feature, such as `src/laser/`, `src/board/`, and `src/levels/`. Keep user-facing setup and gameplay documentation in `README.md`; keep short-lived implementation planning in `TASKS.md`.

Do not commit generated output, editor caches, local configuration, or dependencies. Update ignore rules when introducing a new toolchain.

## Coding Style & Naming Conventions

Use the formatter and linter configured by the project. Unless the selected toolchain specifies otherwise, use four-space indentation, focused modules, and small single-purpose functions. Prefer immutable level definitions and explicit game-state transitions where practical.

Use `PascalCase` for classes and major UI components, `camelCase` for functions and variables, and `UPPER_SNAKE_CASE` for constants. Use descriptive, lowercase asset names with underscores, such as `player_idle.png` and `laser_beam.wav`.

## Game-Logic Rules

Keep laser simulation independent from rendering and input so it can be tested deterministically. Board coordinates, mirror orientations, wall collisions, target detection, and loop prevention should be represented explicitly. A change to reflection or collision behavior must include or update automated tests.

## Testing Guidelines

Test board boundaries, every mirror orientation, wall collisions, target hits, unreachable targets, and repeating laser paths. Name tests after observable behavior, for example `laser_reflects_from_diagonal_mirror`. Run the project’s documented test command before submitting changes.

## Commit & Pull Request Guidelines

Write concise, imperative commit subjects, optionally with a scope: `feat(laser): add mirror reflection`. Keep commits focused. Pull requests must describe the change, list validation performed, link related issues when applicable, and include screenshots or a short recording for visual or gameplay changes.

## Configuration & Generated Files

Never commit secrets or machine-specific settings. Document required environment variables and local setup steps without including private values.
