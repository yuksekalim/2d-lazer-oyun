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
    const normalized = DIRECTION_NAMES[String(direction).toLowerCase()] ?? direction;
    if (!Object.values(DIRECTIONS).includes(normalized)) {
        throw new RangeError(`Unsupported laser direction: ${direction}`);
    }
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

function toPhysicsCell(cell) {
    return { x: cell.col, y: cell.row };
}

/** Convert authored level content into the UI/physics contract. */
export function normalizeLevel(rawLevel) {
    const { board } = rawLevel;
    const rawSource = rawLevel.source ?? rawLevel.emitter;
    if (!rawSource) throw new Error(`Level ${rawLevel.id} has no source`);

    const portals = (rawLevel.portals ?? []).map((portal) => ({
        id: portal.id,
        role: portal.role,
        row: portal.position.y,
        col: portal.position.x,
        direction: normalizeDirection(portal.direction ?? portal.facingDirection),
        facingDirection: normalizeDirection(portal.direction ?? portal.facingDirection),
        color: portal.color,
    }));
    const targetPortal = portals.find((portal) => portal.role === "target");
    const rawTarget = rawLevel.target?.portalId
        ? portals.find((portal) => portal.id === rawLevel.target.portalId)
        : rawLevel.target;
    if (!rawTarget) throw new Error(`Level ${rawLevel.id} has no target portal`);
    const targetCell = rawTarget.position ? toUiCell(rawTarget.position) : { row: rawTarget.row, col: rawTarget.col };

    const source = {
        ...toUiCell(rawSource.position),
        role: rawSource.role ?? "emitter",
        direction: normalizeDirection(rawSource.direction),
        ...(rawSource.portalId ? { portalId: rawSource.portalId } : {}),
        ...(rawSource.color ? { color: rawSource.color } : {}),
    };

    return {
        id: rawLevel.id,
        name: rawLevel.name,
        size: board.width,
        source,
        target: {
            ...targetCell,
            role: "target",
            portalId: rawTarget.id,
            facingDirection: normalizeDirection(rawTarget.direction ?? rawTarget.facingDirection),
            color: rawTarget.color ?? "orange",
        },
        portals,
        walls: (rawLevel.obstacles ?? []).map(toUiCell),
        mirrors: (rawLevel.mirrors ?? []).map((mirror) => ({
            id: mirror.id,
            label: mirror.id,
            row: mirror.position.y,
            col: mirror.position.x,
            orientation: normalizeOrientation(mirror.orientation),
            initialOrientation: normalizeOrientation(mirror.orientation),
            rotatable: mirror.rotatable !== false,
        })),
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
        portals: level.portals.map((portal) => ({ ...portal })),
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
        walls: boardState.walls.map(toPhysicsCell),
        mirrors: boardState.mirrors.map((mirror) => ({
            position: toPhysicsCell(mirror),
            orientation: normalizeOrientation(mirror.orientation),
        })),
        portals: boardState.portals.map((portal) => ({
            id: portal.id,
            role: portal.role,
            position: toPhysicsCell(portal),
            direction: normalizeDirection(portal.facingDirection ?? portal.direction),
            color: portal.color,
        })),
        target: {
            position: toPhysicsCell(boardState.target),
            direction: normalizeDirection(boardState.target.facingDirection),
        },
    };
}

function toUiTerminal(terminal) {
    return {
        ...terminal,
        position: toUiCell(terminal.position),
    };
}

/** Adapt the deterministic physics result to the row/column UI shape. */
export function simulate(boardState) {
    const result = simulateLaser(
        toPhysicsBoard(boardState),
        {
            position: toPhysicsCell(boardState.source),
            direction: normalizeDirection(boardState.source.direction),
            portalId: boardState.source.portalId,
        },
    );

    return {
        beamPath: result.path.map(toUiCell),
        reflections: result.reflections.map((reflection) => ({
            ...reflection,
            position: toUiCell(reflection.position),
        })),
        portalEvents: result.portalEvents.map((event) => ({
            ...event,
            ...(event.position ? { position: toUiCell(event.position) } : {}),
        })),
        terminalReason: result.terminal.reason,
        terminal: toUiTerminal(result.terminal),
        targetHit: result.targetHit,
        loopDetected: ["loop", "portal-loop"].includes(result.terminal.reason),
    };
}

export async function loadMvpLevel() {
    const response = await fetch("../../levels/levels.json");
    if (!response.ok) throw new Error(`Unable to load levels: ${response.status}`);

    const content = await response.json();
    const rawLevels = content.levels?.filter((candidate) => ["easy_01", "easy_02"].includes(candidate.id));
    if (rawLevels?.length !== 2) throw new Error("Teleport MVP requires exactly two levels");
    return rawLevels.map(normalizeLevel);
}
