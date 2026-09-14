/**
 * Cardinal directions used by the grid-based laser simulation.
 */
export const DIRECTIONS = Object.freeze({
    NORTH: "N",
    EAST: "E",
    SOUTH: "S",
    WEST: "W",
});

/**
 * The two diagonal mirror faces supported by the MVP.
 */
export const MIRROR_ORIENTATIONS = Object.freeze({
    SLASH: "/",
    BACKSLASH: "\\",
});

const DIRECTION_VECTORS = Object.freeze({
    [DIRECTIONS.NORTH]: Object.freeze({ x: 0, y: -1 }),
    [DIRECTIONS.EAST]: Object.freeze({ x: 1, y: 0 }),
    [DIRECTIONS.SOUTH]: Object.freeze({ x: 0, y: 1 }),
    [DIRECTIONS.WEST]: Object.freeze({ x: -1, y: 0 }),
});

const REFLECTIONS = Object.freeze({
    [MIRROR_ORIENTATIONS.SLASH]: Object.freeze({
        [DIRECTIONS.NORTH]: DIRECTIONS.EAST,
        [DIRECTIONS.EAST]: DIRECTIONS.NORTH,
        [DIRECTIONS.SOUTH]: DIRECTIONS.WEST,
        [DIRECTIONS.WEST]: DIRECTIONS.SOUTH,
    }),
    [MIRROR_ORIENTATIONS.BACKSLASH]: Object.freeze({
        [DIRECTIONS.NORTH]: DIRECTIONS.WEST,
        [DIRECTIONS.WEST]: DIRECTIONS.NORTH,
        [DIRECTIONS.SOUTH]: DIRECTIONS.EAST,
        [DIRECTIONS.EAST]: DIRECTIONS.SOUTH,
    }),
});

function assertKnownDirection(direction) {
    if (!Object.hasOwn(DIRECTION_VECTORS, direction)) {
        throw new RangeError(`Unknown laser direction: ${direction}`);
    }
}

function assertKnownOrientation(orientation) {
    if (!Object.hasOwn(REFLECTIONS, orientation)) {
        throw new RangeError(`Unknown mirror orientation: ${orientation}`);
    }
}

/**
 * Return the unit vector for a cardinal direction.
 */
export function directionVector(direction) {
    assertKnownDirection(direction);
    return DIRECTION_VECTORS[direction];
}

/**
 * Move one grid cell in the supplied direction without mutating the input.
 */
export function step(position, direction) {
    const vector = directionVector(direction);
    return {
        x: position.x + vector.x,
        y: position.y + vector.y,
    };
}

/**
 * Determine whether a grid position lies within a board's bounds.
 */
export function isInsideBoard(position, board) {
    return (
        Number.isInteger(position?.x) &&
        Number.isInteger(position?.y) &&
        Number.isInteger(board?.width) &&
        Number.isInteger(board?.height) &&
        board.width > 0 &&
        board.height > 0 &&
        position.x >= 0 &&
        position.x < board.width &&
        position.y >= 0 &&
        position.y < board.height
    );
}

/**
 * Produce a stable key for a grid position.
 */
export function positionKey(position) {
    return `${position.x},${position.y}`;
}

/**
 * Produce a stable key for a laser state. Direction matters: revisiting a cell
 * from a different direction is not necessarily a loop.
 */
export function laserStateKey(position, direction) {
    assertKnownDirection(direction);
    return `${positionKey(position)}:${direction}`;
}

/**
 * Reflect a direction from a diagonal mirror.
 */
export function reflectDirection(direction, orientation) {
    assertKnownDirection(direction);
    assertKnownOrientation(orientation);
    return REFLECTIONS[orientation][direction];
}
