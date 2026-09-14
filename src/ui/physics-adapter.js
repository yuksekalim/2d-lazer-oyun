import { DIRECTIONS, MIRROR_ORIENTATIONS } from "../physics/geometry.js";
import { simulateLaser } from "../physics/laser.js";

const DIRECTION_NAMES = Object.freeze({
    north: DIRECTIONS.NORTH,
    east: DIRECTIONS.EAST,
    south: DIRECTIONS.SOUTH,
    west: DIRECTIONS.WEST,
    n: DIRECTIONS.NORTH,
    e: DIRECTIONS.EAST,
    s: DIRECTIONS.SOUTH,
    w: DIRECTIONS.WEST,
});

const ORIENTATION_NAMES = Object.freeze({
    slash: MIRROR_ORIENTATIONS.SLASH,
    backslash: MIRROR_ORIENTATIONS.BACKSLASH,
    [MIRROR_ORIENTATIONS.SLASH]: MIRROR_ORIENTATIONS.SLASH,
    [MIRROR_ORIENTATIONS.BACKSLASH]: MIRROR_ORIENTATIONS.BACKSLASH,
});

function normalizeDirection(direction) {
    const normalized = DIRECTION_NAMES[String(direction).toLowerCase()];
    if (!normalized) throw new RangeError(`Unsupported emitter direction: ${direction}`);
    return normalized;
}

export function normalizeOrientation(orientation) {
    const normalized = ORIENTATION_NAMES[orientation];
    if (!normalized) throw new RangeError(`Unsupported mirror orientation: ${orientation}`);
    return normalized;
}

function toUiCell(position) {
    return { row: position.y, col: position.x };
}

/** Convert the Level Agent's content format into the UI/physics contract. */
export function normalizeLevel(rawLevel) {
    const { board, emitter, target } = rawLevel;
    const source = {
        ...toUiCell(emitter.position),
        direction: normalizeDirection(emitter.direction),
    };
    const normalizedTarget = toUiCell(target.position);
    const walls = (rawLevel.obstacles ?? []).map(toUiCell);
    const mirrors = (rawLevel.mirrors ?? []).map((mirror) => ({
        id: mirror.id,
        label: mirror.id,
        row: mirror.position.y,
        col: mirror.position.x,
        orientation: normalizeOrientation(mirror.orientation),
        initialOrientation: normalizeOrientation(mirror.orientation),
        rotatable: mirror.rotatable !== false,
    }));

    return {
        id: rawLevel.id,
        name: rawLevel.name,
        size: board.width,
        source,
        target: normalizedTarget,
        walls,
        mirrors,
        solution: (rawLevel.solution ?? []).map((item) => ({
            mirror: item.mirror,
            orientation: normalizeOrientation(item.orientation),
        })),
    };
}

export function createInitialState(level) {
    return {
        levelId: level.id,
        size: level.size,
        source: { ...level.source },
        target: { ...level.target },
        walls: level.walls.map((wall) => ({ ...wall })),
        mirrors: level.mirrors.map((mirror) => ({
            ...mirror,
            orientation: mirror.initialOrientation,
        })),
    };
}

function toPhysicsBoard(boardState) {
    return {
        width: boardState.size,
        height: boardState.size,
        walls: boardState.walls.map(({ row, col }) => ({ x: col, y: row })),
        mirrors: boardState.mirrors.map((mirror) => ({
            position: { x: mirror.col, y: mirror.row },
            orientation: normalizeOrientation(mirror.orientation),
        })),
        target: { x: boardState.target.col, y: boardState.target.row },
    };
}

/** Adapt the physics result to the row/column shape consumed by the renderer. */
export function simulate(boardState) {
    const result = simulateLaser(
        toPhysicsBoard(boardState),
        {
            position: { x: boardState.source.col, y: boardState.source.row },
            direction: normalizeDirection(boardState.source.direction),
        },
    );

    return {
        beamPath: result.path.map(toUiCell),
        terminalReason: result.terminal.reason,
        terminal: result.terminal,
        targetHit: result.targetHit,
        loopDetected: result.terminal.reason === "loop",
    };
}

export async function loadMvpLevel() {
    const response = await fetch("../../levels/levels.json");
    if (!response.ok) throw new Error(`Unable to load levels: ${response.status}`);

    const content = await response.json();
    const rawLevel = content.levels?.find((candidate) => candidate.id === 'beginner_01')
        ?? content.levels?.find((candidate) => candidate.board.width === 5)
        ?? content.levels?.[0];
    if (!rawLevel) throw new Error("No level data is available");
    return normalizeLevel(rawLevel);
}
