# Backlog

This file tracks work that has been started but is incomplete, paused, or deferred. It keeps unfinished work visible without mixing it with the active implementation checklist in `TASKS.md`.

## Current Items

### Campaign agent prototypes need rework

- **Area:** Levels and UI
- **Status:** Paused after review
- **Current state:** The Level and UI agent branches contain a nine-level, three-per-difficulty prototype. It validates locally, but it does not meet the confirmed 15-level campaign contract.
- **Remaining work:** Author 15 levels for each independent difficulty, add real mini-grid overview placement and portal chaining, then implement the difficulty screen, zoom transition, checkpoints at Levels 5 and 10, segment restarts, and final actions.
- **Files:** `levels/levels.json`, `levels/validate_levels.py`, `src/ui/app.js`, `src/ui/index.html`, `src/ui/styles.css`; branches `agent/levels` and `agent/ui`.
- **Notes:** Do not merge commits `cb6e213` or `f3e3c00` wholesale. Their three-level assumption and direct difficulty tabs conflict with `README.md` and the confirmed rules.

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
