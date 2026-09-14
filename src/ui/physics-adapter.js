/**
 * Temporary UI-side physics adapter.
 *
 * The physics agent has not shipped an implementation yet. The UI consumes
 * this contract so the demo is interactive without duplicating the eventual
 * simulation in the renderer:
 *
 *   simulate(boardState) -> {
 *       beamPath: Array<{ row: number, col: number }>,
 *       terminalReason: 'target' | 'boundary' | 'wall' | 'loop',
 *       targetHit: boolean,
 *       loopDetected: boolean
 *   }
 *
 * Replace `simulatePlaceholder` with the physics agent's `simulate` export
 * when it becomes available. The paths below are precomputed presentation
 * fixtures, not reflection logic. They exist only to exercise UI states.
 * Orientation convention for this fixture: 0 renders `/` and 1 renders `\\`.
 * A beam entering `/` from the right reflects upward; entering `\\` from the
 * right reflects downward.
 */

export const DEMO_LEVEL = Object.freeze({
    id: 'sector-01',
    size: 8,
    source: Object.freeze({ row: 7, col: 0, direction: 'right' }),
    target: Object.freeze({ row: 1, col: 6 }),
    walls: Object.freeze([
        Object.freeze({ row: 0, col: 0 }),
        Object.freeze({ row: 0, col: 1 }),
        Object.freeze({ row: 1, col: 1 }),
        Object.freeze({ row: 2, col: 1 }),
        Object.freeze({ row: 3, col: 5 }),
        Object.freeze({ row: 4, col: 5 }),
        Object.freeze({ row: 6, col: 5 }),
        Object.freeze({ row: 7, col: 5 }),
    ]),
    mirrors: Object.freeze([
        Object.freeze({ id: 'mirror-alpha', label: 'Alpha', row: 7, col: 2, orientation: 0 }),
        Object.freeze({ id: 'mirror-beta', label: 'Beta', row: 5, col: 2, orientation: 0 }),
        Object.freeze({ id: 'mirror-gamma', label: 'Gamma', row: 5, col: 6, orientation: 0 }),
    ]),
});

const SOLUTION = Object.freeze([0, 1, 0]);
const START_PATH = Object.freeze([
    { row: 7, col: 0 }, { row: 7, col: 1 }, { row: 7, col: 2 },
]);
const ALPHA_PATH = Object.freeze([
    ...START_PATH,
    { row: 6, col: 2 }, { row: 5, col: 2 },
]);
const BETA_PATH = Object.freeze([
    ...ALPHA_PATH,
    { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }, { row: 5, col: 6 },
]);
const SOLUTION_PATH = Object.freeze([
    ...BETA_PATH,
    { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 },
]);

const pathToBoundary = (path, row, col, direction) => {
    const result = [...path];
    let currentRow = row;
    let currentCol = col;

    while (currentRow >= 0 && currentRow < DEMO_LEVEL.size && currentCol >= 0 && currentCol < DEMO_LEVEL.size) {
        result.push({ row: currentRow, col: currentCol });
        if (direction === 'up') currentRow -= 1;
        if (direction === 'right') currentCol += 1;
    }

    return result;
};

const mirrorOrientations = (boardState) => boardState.mirrors.map((mirror) => mirror.orientation);

export function simulatePlaceholder(boardState) {
    const orientations = mirrorOrientations(boardState);

    if (orientations.every((orientation, index) => orientation === SOLUTION[index])) {
        return {
            beamPath: SOLUTION_PATH,
            terminalReason: 'target',
            targetHit: true,
            loopDetected: false,
        };
    }

    if (orientations[0] !== SOLUTION[0]) {
        return {
            beamPath: pathToBoundary(START_PATH, 7, 3, 'right'),
            terminalReason: 'boundary',
            targetHit: false,
            loopDetected: false,
        };
    }

    if (orientations[1] !== SOLUTION[1]) {
        return {
            beamPath: pathToBoundary(ALPHA_PATH, 4, 2, 'up'),
            terminalReason: 'boundary',
            targetHit: false,
            loopDetected: false,
        };
    }

    return {
        beamPath: pathToBoundary(BETA_PATH, 5, 7, 'right'),
        terminalReason: 'boundary',
        targetHit: false,
        loopDetected: false,
    };
}
