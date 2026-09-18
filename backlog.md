# Backlog

This file tracks work that has been started but is incomplete, paused, or deferred. It keeps unfinished work visible without mixing it with the active implementation checklist in `TASKS.md`.

## Current Items

### Campaign orchestration needs completion

- **Area:** Levels and UI
- **Status:** Partially complete
- **Current state:** The main branch contains 30 validated levels (ten Easy, ten Medium, ten Hard), direct difficulty tabs, automatic level progression, shared lives, replay, and campaign completion feedback. The older `agent/levels` and `agent/ui` branches remain historical prototypes.
- **Remaining work:** Add the initial difficulty screen, real mini-grid overview placement and rendering, zoom transitions, the Level 5 checkpoint, Level 1/6 segment restarts, refresh reset behavior, and **Choose Difficulty** after Level 10.
- **Files:** `levels/levels.json`, `levels/validate_levels.py`, `src/ui/app.js`, `src/ui/index.html`, `src/ui/styles.css`, and the campaign documentation.
- **Notes:** Do not merge commits `cb6e213` or `f3e3c00` wholesale. They contain earlier nine-level/three-level assumptions; use the current main-branch data and runtime as the baseline.

## Entry Template

When moving an unfinished task here, record enough context for another contributor to resume it:

### [Short task title]

- **Area:** Physics, Levels, UI, or Foundation
- **Status:** Partially complete / Paused / Blocked
- **Current state:** What has been implemented
- **Remaining work:** The specific next steps
- **Files:** Relevant paths or branches
- **Notes:** Decisions, known issues, or dependencies

Move an item back to `TASKS.md` when it becomes active again. Remove it from this file after completion and record the outcome in the relevant project documentation or commit history.
