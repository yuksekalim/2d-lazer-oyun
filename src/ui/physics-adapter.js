import { DIRECTIONS, MIRROR_ORIENTATIONS } from '../physics/geometry.js';
import { simulateLaser } from '../physics/laser.js';

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

const DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard']);
const LEVELS_PER_DIFFICULTY = 10;
const EXPECTED_LEVEL_IDS = new Set(DIFFICULTIES.flatMap((difficulty) => (
    Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, index) => `${difficulty}_${String(index + 1).padStart(2, '0')}`)
)));

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
    const rawTarget = rawLevel.target?.portalId
        ? portals.find((portal) => portal.id === rawLevel.target.portalId)
        : rawLevel.target;
    if (!rawTarget) throw new Error(`Level ${rawLevel.id} has no target portal`);
    const targetCell = rawTarget.position
        ? toUiCell(rawTarget.position)
        : { row: rawTarget.row, col: rawTarget.col };

    const source = {
        ...toUiCell(rawSource.position),
        role: rawSource.role ?? 'emitter',
        direction: normalizeDirection(rawSource.direction),
        ...(rawSource.portalId ? { portalId: rawSource.portalId } : {}),
        ...(rawSource.color ? { color: rawSource.color } : {}),
    };

    return {
        id: rawLevel.id,
        name: rawLevel.name,
        difficulty: rawLevel.id.split('_')[0],
        size: board.width,
        source,
        target: {
            ...targetCell,
            role: 'target',
            portalId: rawTarget.id,
            facingDirection: normalizeDirection(rawTarget.direction ?? rawTarget.facingDirection),
            color: rawTarget.color ?? 'orange',
        },
        portals,
        walls: (rawLevel.obstacles ?? []).map(toUiCell),
        mirrors: (rawLevel.mirrors ?? []).map((mirror) => ({
            id: mirror.id,
            label: mirror.id.replace(/_/g, ' '),
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
        loopDetected: ['loop', 'portal-loop'].includes(result.terminal.reason),
    };
}

export async function loadMvpLevel() {
    const response = await fetch('../../levels/levels.json?v=10-level-campaign-2');
    if (!response.ok) throw new Error(`Unable to load levels: ${response.status}`);

    const content = await response.json();
    const campaignCandidates = Array.isArray(content.levels)
        ? content.levels.filter((candidate) => typeof candidate?.id === 'string' && /^(easy|medium|hard)_\d+$/.test(candidate.id))
        : [];
    const candidateIds = campaignCandidates.map((candidate) => candidate.id);
    const candidateIdSet = new Set(candidateIds);
    const hasExactCampaign = candidateIds.length === EXPECTED_LEVEL_IDS.size
        && candidateIdSet.size === EXPECTED_LEVEL_IDS.size
        && candidateIds.every((id) => EXPECTED_LEVEL_IDS.has(id));
    if (!hasExactCampaign) throw new Error('Campaign requires exactly easy_01–10, medium_01–10, and hard_01–10');
    const rawLevels = campaignCandidates.filter((candidate) => EXPECTED_LEVEL_IDS.has(candidate.id));
    return rawLevels.map(normalizeLevel);
}
