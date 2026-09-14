import {
    DIRECTIONS,
    MIRROR_ORIENTATIONS,
    isInsideBoard,
    laserStateKey,
    positionKey,
    reflectDirection,
    step,
} from "./geometry.js";

export const TERMINAL_REASONS = Object.freeze({
    BOUNDARY: "boundary",
    WALL: "wall",
    TARGET: "target",
    WRONG_TARGET_DIRECTION: "wrong-target-direction",
    SOURCE_REENTRY: "source-reentry",
    LOOP: "loop",
    PORTAL_LOOP: "portal-loop",
    STEP_LIMIT: "step-limit",
});

const VALID_DIRECTIONS = new Set(Object.values(DIRECTIONS));
const VALID_ORIENTATIONS = new Set(Object.values(MIRROR_ORIENTATIONS));

function clonePosition(position) {
    return { x: position.x, y: position.y };
}

function assertPosition(position, name) {
    if (!Number.isInteger(position?.x) || !Number.isInteger(position?.y)) {
        throw new TypeError(`${name} must have integer x and y coordinates`);
    }
}

function assertBoardPosition(position, board, name) {
    assertPosition(position, name);
    if (!isInsideBoard(position, board)) {
        throw new RangeError(`${name} must be inside the board`);
    }
}

function assertDirection(direction, name) {
    if (!VALID_DIRECTIONS.has(direction)) {
        throw new RangeError(`${name} must be one of N, E, S, or W`);
    }
}

function normalizeBoard(board) {
    if (!Number.isInteger(board?.width) || !Number.isInteger(board?.height)) {
        throw new TypeError("Board width and height must be integers");
    }
    if (board.width <= 0 || board.height <= 0) {
        throw new RangeError("Board width and height must be positive");
    }

    const walls = new Set();
    for (const wall of board.walls ?? []) {
        assertBoardPosition(wall, board, "Wall position");
        const key = positionKey(wall);
        if (walls.has(key)) throw new Error(`Duplicate wall at ${key}`);
        walls.add(key);
    }

    const mirrors = new Map();
    for (const mirror of board.mirrors ?? []) {
        assertBoardPosition(mirror?.position, board, "Mirror position");
        if (!VALID_ORIENTATIONS.has(mirror.orientation)) {
            throw new RangeError("Mirror orientation must be / or \\");
        }
        const key = positionKey(mirror.position);
        if (mirrors.has(key)) throw new Error(`Duplicate mirror at ${key}`);
        mirrors.set(key, mirror.orientation);
    }

    const portals = new Map();
    for (const portal of board.portals ?? []) {
        assertBoardPosition(portal?.position, board, "Portal position");
        if (portal.role !== "source" && portal.role !== "target") {
            throw new RangeError("Portal role must be source or target");
        }
        assertDirection(portal.direction, "Portal direction");
        const key = positionKey(portal.position);
        if (portals.has(key)) throw new Error(`Duplicate portal at ${key}`);
        portals.set(key, {
            id: portal.id ?? key,
            role: portal.role,
            position: clonePosition(portal.position),
            direction: portal.direction,
        });
    }

    const rawTarget = board.target?.position ?? board.target;
    const targetPortal = [...portals.values()].find((portal) => portal.role === "target");
    const targetPosition = rawTarget ?? targetPortal?.position;
    if (!targetPosition) throw new TypeError("A target position or target portal is required");
    assertBoardPosition(targetPosition, board, "Target position");
    const targetDirection = board.target?.direction
        ?? board.target?.facingDirection
        ?? (targetPortal?.position && positionKey(targetPortal.position) === positionKey(targetPosition)
            ? targetPortal.direction
            : undefined);

    return {
        width: board.width,
        height: board.height,
        walls,
        mirrors,
        portals,
        target: clonePosition(targetPosition),
        targetDirection,
    };
}

function createResult(path, reflections, portalEvents, terminal, targetHit, steps) {
    return {
        path,
        reflections,
        portalEvents,
        terminal,
        targetHit,
        steps,
    };
}

function terminalResult(path, reflections, portalEvents, reason, position, direction, targetHit, steps, portalId) {
    return createResult(
        path,
        reflections,
        portalEvents,
        { reason, position: clonePosition(position), direction, ...(portalId ? { portalId } : {}) },
        targetHit,
        steps,
    );
}

/**
 * Trace a laser through a rectangular board one cell at a time.
 *
 * The source cell is included in `path`. Walls and boundary collisions are
 * not included in that path. Portal cells are included so the UI can animate
 * source activation and target entry. Legacy boards without portals keep the
 * original target behavior and accept entry from any direction.
 */
export function simulateLaser(board, source, options = {}) {
    const normalizedBoard = normalizeBoard(board);
    assertBoardPosition(source?.position, normalizedBoard, "Source position");
    assertDirection(source?.direction, "Source direction");

    const sourceKey = positionKey(source.position);
    const sourcePortal = normalizedBoard.portals.get(sourceKey);
    if (sourcePortal && sourcePortal.role !== "source") {
        throw new Error("A source cannot occupy a target portal");
    }
    if (normalizedBoard.walls.has(sourceKey)) throw new Error("Source cannot occupy a wall");
    if (normalizedBoard.mirrors.has(sourceKey)) throw new Error("Source cannot occupy a mirror");
    if (sourceKey === positionKey(normalizedBoard.target)) {
        throw new Error("Source and target must occupy different cells");
    }

    const configuredLimit = options.maxSteps;
    const maxSteps = configuredLimit ?? normalizedBoard.width * normalizedBoard.height * 4 + 1;
    if (!Number.isInteger(maxSteps) || maxSteps <= 0) throw new RangeError("maxSteps must be a positive integer");

    const path = [clonePosition(source.position)];
    const reflections = [];
    const portalEvents = sourcePortal
        ? [{ type: "source-emit", portalId: sourcePortal.id, position: clonePosition(source.position), direction: source.direction }]
        : [];
    const visitedStates = new Set();
    let position = clonePosition(source.position);
    let direction = source.direction;
    let steps = 0;

    while (true) {
        const stateKey = laserStateKey(position, direction);
        if (visitedStates.has(stateKey)) {
            const reason = portalEvents.length > 0
                ? TERMINAL_REASONS.PORTAL_LOOP
                : TERMINAL_REASONS.LOOP;
            return terminalResult(path, reflections, portalEvents, reason, position, direction, false, steps);
        }
        visitedStates.add(stateKey);

        if (steps >= maxSteps) {
            return terminalResult(path, reflections, portalEvents, TERMINAL_REASONS.STEP_LIMIT, position, direction, false, steps);
        }

        const nextPosition = step(position, direction);
        steps += 1;

        if (!isInsideBoard(nextPosition, normalizedBoard)) {
            return terminalResult(path, reflections, portalEvents, TERMINAL_REASONS.BOUNDARY, nextPosition, direction, false, steps);
        }

        const nextKey = positionKey(nextPosition);
        if (normalizedBoard.walls.has(nextKey)) {
            return terminalResult(path, reflections, portalEvents, TERMINAL_REASONS.WALL, nextPosition, direction, false, steps);
        }

        path.push(clonePosition(nextPosition));
        position = nextPosition;

        if (nextKey === sourceKey && sourcePortal) {
            portalEvents.push({ type: "source-enter", portalId: sourcePortal.id, position: clonePosition(position), direction });
            return terminalResult(path, reflections, portalEvents, TERMINAL_REASONS.SOURCE_REENTRY, position, direction, false, steps, sourcePortal.id);
        }

        if (nextKey === positionKey(normalizedBoard.target)) {
            const targetPortal = normalizedBoard.portals.get(nextKey);
            const accepted = normalizedBoard.targetDirection === undefined
                || normalizedBoard.targetDirection === direction;
            portalEvents.push({
                type: "target-enter",
                portalId: targetPortal?.id,
                position: clonePosition(position),
                direction,
                accepted,
            });
            if (!accepted) {
                return terminalResult(path, reflections, portalEvents, TERMINAL_REASONS.WRONG_TARGET_DIRECTION, position, direction, false, steps, targetPortal?.id);
            }
            return terminalResult(path, reflections, portalEvents, TERMINAL_REASONS.TARGET, position, direction, true, steps, targetPortal?.id);
        }

        const orientation = normalizedBoard.mirrors.get(nextKey);
        if (orientation !== undefined) {
            const incomingDirection = direction;
            direction = reflectDirection(direction, orientation);
            reflections.push({
                position: clonePosition(position),
                orientation,
                from: incomingDirection,
                to: direction,
            });
        }
    }
}
