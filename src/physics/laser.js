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
    LOOP: "loop",
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
        if (walls.has(key)) {
            throw new Error(`Duplicate wall at ${key}`);
        }
        walls.add(key);
    }

    const mirrors = new Map();
    for (const mirror of board.mirrors ?? []) {
        assertBoardPosition(mirror?.position, board, "Mirror position");
        if (!VALID_ORIENTATIONS.has(mirror.orientation)) {
            throw new RangeError("Mirror orientation must be / or \\");
        }
        const key = positionKey(mirror.position);
        if (mirrors.has(key)) {
            throw new Error(`Duplicate mirror at ${key}`);
        }
        mirrors.set(key, mirror.orientation);
    }

    const target = board.target?.position ?? board.target;
    assertBoardPosition(target, board, "Target position");

    return {
        width: board.width,
        height: board.height,
        walls,
        mirrors,
        target: clonePosition(target),
    };
}

function createResult(path, reflections, terminal, targetHit, steps) {
    return {
        path,
        reflections,
        terminal,
        targetHit,
        steps,
    };
}

/**
 * Trace a laser through a rectangular board one cell at a time.
 *
 * The source cell is included in `path`. A wall or boundary collision is not
 * included in that path; its exact position is reported by `terminal.position`.
 * Mirror cells are included before their reflection is recorded. A loop is
 * identified by revisiting the same cell with the same direction.
 */
export function simulateLaser(board, source, options = {}) {
    const normalizedBoard = normalizeBoard(board);
    assertBoardPosition(source?.position, normalizedBoard, "Source position");
    assertDirection(source?.direction, "Source direction");

    const sourceKey = positionKey(source.position);
    if (normalizedBoard.walls.has(sourceKey)) {
        throw new Error("Source cannot occupy a wall");
    }
    if (normalizedBoard.mirrors.has(sourceKey)) {
        throw new Error("Source cannot occupy a mirror");
    }
    if (sourceKey === positionKey(normalizedBoard.target)) {
        throw new Error("Source and target must occupy different cells");
    }

    const configuredLimit = options.maxSteps;
    const maxSteps = configuredLimit ?? normalizedBoard.width * normalizedBoard.height * 4 + 1;
    if (!Number.isInteger(maxSteps) || maxSteps <= 0) {
        throw new RangeError("maxSteps must be a positive integer");
    }

    const path = [clonePosition(source.position)];
    const reflections = [];
    const visitedStates = new Set();
    let position = clonePosition(source.position);
    let direction = source.direction;
    let steps = 0;

    while (true) {
        const stateKey = laserStateKey(position, direction);
        if (visitedStates.has(stateKey)) {
            return createResult(
                path,
                reflections,
                {
                    reason: TERMINAL_REASONS.LOOP,
                    position: clonePosition(position),
                    direction,
                },
                false,
                steps,
            );
        }
        visitedStates.add(stateKey);

        if (steps >= maxSteps) {
            return createResult(
                path,
                reflections,
                {
                    reason: TERMINAL_REASONS.STEP_LIMIT,
                    position: clonePosition(position),
                    direction,
                },
                false,
                steps,
            );
        }

        const nextPosition = step(position, direction);
        steps += 1;

        if (!isInsideBoard(nextPosition, normalizedBoard)) {
            return createResult(
                path,
                reflections,
                {
                    reason: TERMINAL_REASONS.BOUNDARY,
                    position: nextPosition,
                    direction,
                },
                false,
                steps,
            );
        }

        const nextKey = positionKey(nextPosition);
        if (normalizedBoard.walls.has(nextKey)) {
            return createResult(
                path,
                reflections,
                {
                    reason: TERMINAL_REASONS.WALL,
                    position: clonePosition(nextPosition),
                    direction,
                },
                false,
                steps,
            );
        }

        path.push(clonePosition(nextPosition));
        position = nextPosition;

        if (nextKey === positionKey(normalizedBoard.target)) {
            return createResult(
                path,
                reflections,
                {
                    reason: TERMINAL_REASONS.TARGET,
                    position: clonePosition(position),
                    direction,
                },
                true,
                steps,
            );
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
