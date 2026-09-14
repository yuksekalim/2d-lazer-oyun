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
const VALID_PORTAL_ROLES = new Set(["source", "target"]);
const PORTAL_COLORS = Object.freeze({ source: "blue", target: "orange" });

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

function expectedPortalDirection(position, board, role) {
    if (position.x === 0) return role === "source" ? DIRECTIONS.EAST : DIRECTIONS.WEST;
    if (position.x === board.width - 1) return role === "source" ? DIRECTIONS.WEST : DIRECTIONS.EAST;
    if (position.y === 0) return role === "source" ? DIRECTIONS.SOUTH : DIRECTIONS.NORTH;
    if (position.y === board.height - 1) return role === "source" ? DIRECTIONS.NORTH : DIRECTIONS.SOUTH;
    return undefined;
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

    const rawPortals = board.portals ?? [];
    if (!Array.isArray(rawPortals)) throw new TypeError("Board portals must be an array");
    if (rawPortals.length > 2) throw new RangeError("A board can contain at most two portals");

    const portals = new Map();
    const portalsById = new Map();
    const roles = new Set();
    for (const portal of rawPortals) {
        assertBoardPosition(portal?.position, board, "Portal position");
        if (!VALID_PORTAL_ROLES.has(portal.role)) throw new RangeError("Portal role must be source or target");
        if (roles.has(portal.role)) throw new Error(`Duplicate ${portal.role} portal`);
        roles.add(portal.role);
        if (typeof portal.id !== "string" || portal.id.trim() === "") {
            throw new TypeError("Portal id must be a non-empty string");
        }
        if (portalsById.has(portal.id)) throw new Error(`Duplicate portal id: ${portal.id}`);
        assertDirection(portal.direction, "Portal direction");
        const expectedDirection = expectedPortalDirection(portal.position, board, portal.role);
        if (expectedDirection === undefined || portal.direction !== expectedDirection) {
            throw new RangeError("Portal direction must face inward from the board border");
        }
        if (portal.color !== PORTAL_COLORS[portal.role]) {
            throw new RangeError(`${portal.role} portals must use the ${PORTAL_COLORS[portal.role]} color`);
        }
        const key = positionKey(portal.position);
        if (portals.has(key)) throw new Error(`Duplicate portal at ${key}`);
        const normalizedPortal = {
            id: portal.id,
            role: portal.role,
            position: clonePosition(portal.position),
            direction: portal.direction,
            color: portal.color,
        };
        portals.set(key, normalizedPortal);
        portalsById.set(portal.id, normalizedPortal);
    }

    for (const key of portals.keys()) {
        if (walls.has(key) || mirrors.has(key)) throw new Error(`Portal overlaps another board element at ${key}`);
    }

    const targetPortalById = board.target?.portalId
        ? portalsById.get(board.target.portalId)
        : undefined;
    if (board.target?.portalId && !targetPortalById) {
        throw new Error(`Unknown target portal: ${board.target.portalId}`);
    }
    if (targetPortalById && targetPortalById.role !== "target") {
        throw new Error("The target portal must have the target role");
    }
    const targetPortal = targetPortalById
        ?? [...portals.values()].find((portal) => portal.role === "target");
    const rawTarget = board.target?.position
        ?? (Number.isInteger(board.target?.x) && Number.isInteger(board.target?.y) ? board.target : undefined);
    const targetPosition = rawTarget ?? targetPortal?.position;
    if (!targetPosition) throw new TypeError("A target position or target portal is required");
    assertBoardPosition(targetPosition, board, "Target position");
    if (targetPortal && positionKey(targetPortal.position) !== positionKey(targetPosition)) {
        throw new Error("Target position must match the target portal");
    }
    const targetDirection = board.target?.direction
        ?? board.target?.facingDirection
        ?? targetPortal?.direction;
    if (targetDirection !== undefined) assertDirection(targetDirection, "Target direction");
    if (targetPortal && targetDirection !== targetPortal.direction) {
        throw new Error("Target direction must match the target portal direction");
    }

    return {
        width: board.width,
        height: board.height,
        walls,
        mirrors,
        portals,
        portalsById,
        target: clonePosition(targetPosition),
        targetDirection,
    };
}

function createPortalEvent(type, portal, position, direction, details = {}) {
    return {
        type,
        ...(portal ? { portalId: portal.id, color: portal.color } : {}),
        position: clonePosition(position),
        direction,
        ...details,
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
    const sourcePortalById = source?.portalId
        ? normalizedBoard.portalsById.get(source.portalId)
        : undefined;
    if (source?.portalId && !sourcePortalById) throw new Error(`Unknown source portal: ${source.portalId}`);
    if (sourcePortalById && sourcePortalById.role !== "source") {
        throw new Error("The source portal must have the source role");
    }
    if (sourcePortalById && positionKey(sourcePortalById.position) !== sourceKey) {
        throw new Error("Source position must match the source portal");
    }
    const sourcePortalAtPosition = normalizedBoard.portals.get(sourceKey);
    const sourcePortal = sourcePortalById ?? sourcePortalAtPosition;
    if (sourcePortal && sourcePortal.role !== "source") {
        throw new Error("A source cannot occupy a target portal");
    }
    if (sourcePortal && source.direction !== sourcePortal.direction) {
        throw new Error("Source direction must match the source portal direction");
    }
    if (normalizedBoard.walls.has(sourceKey)) throw new Error("Source cannot occupy a wall");
    if (normalizedBoard.mirrors.has(sourceKey)) throw new Error("Source cannot occupy a mirror");
    if (sourceKey === positionKey(normalizedBoard.target)) {
        throw new Error("Source and target must occupy different cells");
    }

    const configuredLimit = options.maxSteps;
    const maxSteps = configuredLimit ?? normalizedBoard.width * normalizedBoard.height * 4 + 1;
    if (!Number.isInteger(maxSteps) || maxSteps <= 0) throw new RangeError("maxSteps must be a positive integer");

    const emissionDirection = sourcePortal?.direction ?? source.direction;
    const path = [clonePosition(source.position)];
    const reflections = [];
    const portalEvents = sourcePortal
        ? [createPortalEvent("source-emit", sourcePortal, source.position, emissionDirection)]
        : [];
    const visitedStates = new Set();
    let position = clonePosition(source.position);
    let direction = emissionDirection;
    let steps = 0;

    while (true) {
        const stateKey = laserStateKey(position, direction);
        if (visitedStates.has(stateKey)) {
            const reason = normalizedBoard.portals.size > 0
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
            portalEvents.push(createPortalEvent("source-enter", sourcePortal, position, direction));
            return terminalResult(path, reflections, portalEvents, TERMINAL_REASONS.SOURCE_REENTRY, position, direction, false, steps, sourcePortal.id);
        }

        if (nextKey === positionKey(normalizedBoard.target)) {
            const targetPortal = normalizedBoard.portals.get(nextKey);
            const accepted = normalizedBoard.targetDirection === undefined
                || normalizedBoard.targetDirection === direction;
            portalEvents.push(createPortalEvent("target-enter", targetPortal, position, direction, { accepted }));
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
