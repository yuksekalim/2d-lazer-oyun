/**
 * UI adapter for the teleport MVP.
 *
 * The committed physics branch documents the production contract but does
 * not yet expose portal-aware runtime code. Until that implementation lands,
 * these two small fixtures keep the UI testable. The UI consumes the same
 * shape that the production adapter will return and never calculates a
 * reflection or portal collision itself.
 */

const freezeCells = (cells) => Object.freeze(cells.map((cell) => Object.freeze(cell)));

const LEVEL_FIXTURES = Object.freeze([
    Object.freeze({
        id: 'easy_01',
        name: 'Easy 01 / First Gate',
        size: 7,
        source: Object.freeze({ row: 3, col: 0, role: 'emitter', direction: 'E' }),
        target: Object.freeze({ row: 0, col: 6, role: 'target', facingDirection: 'E', color: 'orange' }),
        portals: Object.freeze([
            Object.freeze({ id: 'target-01', role: 'target', row: 0, col: 6, facingDirection: 'E', color: 'orange' }),
        ]),
        walls: freezeCells([{ row: 1, col: 5 }, { row: 4, col: 5 }]),
        mirrors: Object.freeze([
            Object.freeze({ id: 'mirror-a', label: 'Alpha', row: 3, col: 2, orientation: '\\', initialOrientation: '\\', rotatable: true }),
            Object.freeze({ id: 'mirror-b', label: 'Beta', row: 0, col: 2, orientation: '\\', initialOrientation: '\\', rotatable: true }),
            Object.freeze({ id: 'mirror-c', label: 'Gamma', row: 5, col: 4, orientation: '\\', initialOrientation: '\\', rotatable: true }),
        ]),
        solution: Object.freeze([
            Object.freeze({ mirror: 'mirror-a', orientation: '/' }),
            Object.freeze({ mirror: 'mirror-b', orientation: '/' }),
        ]),
    }),
    Object.freeze({
        id: 'easy_02',
        name: 'Easy 02 / Blue Shift',
        size: 7,
        source: Object.freeze({ row: 6, col: 0, role: 'source', direction: 'E', color: 'blue' }),
        target: Object.freeze({ row: 0, col: 4, role: 'target', facingDirection: 'N', color: 'orange' }),
        portals: Object.freeze([
            Object.freeze({ id: 'source-02', role: 'source', row: 6, col: 0, direction: 'E', color: 'blue' }),
            Object.freeze({ id: 'target-02', role: 'target', row: 0, col: 4, facingDirection: 'N', color: 'orange' }),
        ]),
        walls: freezeCells([{ row: 1, col: 6 }, { row: 3, col: 0 }, { row: 4, col: 3 }, { row: 5, col: 6 }]),
        mirrors: Object.freeze([
            Object.freeze({ id: 'mirror-d', label: 'Delta', row: 6, col: 2, orientation: '\\', initialOrientation: '\\', rotatable: true }),
            Object.freeze({ id: 'mirror-e', label: 'Echo', row: 2, col: 2, orientation: '\\', initialOrientation: '\\', rotatable: true }),
            Object.freeze({ id: 'mirror-f', label: 'Foxtrot', row: 2, col: 4, orientation: '\\', initialOrientation: '\\', rotatable: true }),
        ]),
        solution: Object.freeze([
            Object.freeze({ mirror: 'mirror-d', orientation: '/' }),
            Object.freeze({ mirror: 'mirror-e', orientation: '/' }),
            Object.freeze({ mirror: 'mirror-f', orientation: '/' }),
        ]),
    }),
]);

const ROUTES = Object.freeze({
    easy_01: Object.freeze([
        { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 },
        { row: 2, col: 2 }, { row: 1, col: 2 }, { row: 0, col: 2 },
        { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 0, col: 6 },
    ]),
    easy_02: Object.freeze([
        { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 },
        { row: 5, col: 2 }, { row: 4, col: 2 }, { row: 3, col: 2 }, { row: 2, col: 2 },
        { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 1, col: 4 }, { row: 0, col: 4 },
    ]),
});

const cloneLevel = (level) => ({
    ...level,
    source: { ...level.source },
    target: { ...level.target },
    portals: level.portals.map((portal) => ({ ...portal })),
    walls: level.walls.map((wall) => ({ ...wall })),
    mirrors: level.mirrors.map((mirror) => ({ ...mirror })),
});

export function createInitialState(level) {
    return {
        levelId: level.id,
        size: level.size,
        source: { ...level.source },
        target: { ...level.target },
        portals: level.portals.map((portal) => ({ ...portal })),
        walls: level.walls.map((wall) => ({ ...wall })),
        mirrors: level.mirrors.map((mirror) => ({ ...mirror, orientation: mirror.initialOrientation })),
    };
}

const isSolved = (level, boardState) => level.solution.every(({ mirror, orientation }) => (
    boardState.mirrors.find((candidate) => candidate.id === mirror)?.orientation === orientation
));

const failedPath = (level, boardState) => {
    const route = ROUTES[level.id];
    const firstUnsolved = level.solution.findIndex(({ mirror, orientation }) => (
        boardState.mirrors.find((candidate) => candidate.id === mirror)?.orientation !== orientation
    ));
    const stop = Math.max(2, Math.min(route.length - 1, (firstUnsolved + 1) * 2));
    return route.slice(0, stop);
};

export function simulate(boardState) {
    const level = LEVEL_FIXTURES.find((candidate) => candidate.id === boardState.levelId);
    if (!level) throw new Error(`Unknown placeholder level: ${boardState.levelId}`);
    const targetHit = isSolved(level, boardState);
    const targetPortal = level.portals.find((portal) => portal.role === 'target');
    const beamPath = targetHit ? ROUTES[level.id] : failedPath(level, boardState);
    return {
        beamPath,
        targetHit,
        terminalReason: targetHit ? 'target' : 'boundary',
        terminal: targetHit
            ? { position: { row: level.target.row, col: level.target.col }, direction: level.target.facingDirection, portalId: targetPortal.id }
            : { position: beamPath[beamPath.length - 1], direction: 'E' },
        portalEvents: targetHit ? [{ type: 'target-enter', portalId: targetPortal.id }] : [],
    };
}

export async function loadMvpLevel() {
    return LEVEL_FIXTURES.map(cloneLevel);
}
