import { animateLaser } from '../animation/laser-animation.js';
import { animateMirror } from '../animation/mirror-animation.js';
import { animateTarget } from '../animation/target-animation.js';
import { renderBoard } from '../rendering/board-renderer.js';
import { createInitialState, loadMvpLevel, simulate } from './physics-adapter.js';

const MAX_LIVES = 3;
const LEVELS_PER_DIFFICULTY = 3;
const DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard']);
const DIFFICULTY_LABELS = Object.freeze({ easy: 'Easy', medium: 'Medium', hard: 'Hard' });
const DIRECTION_ARROWS = Object.freeze({ N: '↑', E: '→', S: '↓', W: '←' });
const EDGE_LABELS = Object.freeze({ north: 'NORTH', east: 'EAST', south: 'SOUTH', west: 'WEST' });
const EMPTY_SIMULATION = Object.freeze({ beamPath: [], targetHit: false, terminalReason: null });

const boardElement = document.querySelector('#game-board');
const boardWrap = document.querySelector('#board-wrap');
const appShell = document.querySelector('.app-shell');
const beamLayer = document.querySelector('#beam-layer');
const skipLink = document.querySelector('.skip-link');
const brandLink = document.querySelector('.brand');
const campaignOverview = document.querySelector('#campaign-overview');
const campaignOverviewKicker = document.querySelector('#campaign-overview-kicker');
const campaignOverviewTitle = document.querySelector('#campaign-overview-title');
const routeMapElement = document.querySelector('#route-map');
const levelTagElement = document.querySelector('#level-tag');
const levelProgressElement = document.querySelector('#level-progress');
const levelNameElement = document.querySelector('#level-name');
const boardSizeElement = document.querySelector('#board-size');
const difficultyTabs = [...document.querySelectorAll('.difficulty-tab')];
const livesRow = document.querySelector('#lives-row');
const statusCard = document.querySelector('#status-card');
const statusKicker = document.querySelector('#status-kicker');
const statusTitle = document.querySelector('#status-title');
const statusDetail = document.querySelector('#status-detail');
const fireButton = document.querySelector('#fire-button');
const resetButton = document.querySelector('#reset-button');
const winOverlay = document.querySelector('#win-overlay');
const winKicker = document.querySelector('#win-kicker');
const winTitle = document.querySelector('#win-title');
const winCopy = document.querySelector('#win-copy');
const nextDifficultyButton = document.querySelector('#next-difficulty-button');
const playAgainButton = document.querySelector('#play-again-button');

let levels = [];
let levelsByDifficulty = Object.create(null);
let difficultyId = 'easy';
let levelIndex = 0;
let level = null;
let boardState = null;
let lastSimulation = null;
let lives = MAX_LIVES;
let beamVisible = false;
let isAnimating = false;
let isCoolingDown = false;
let isSolved = false;
let isCampaignIntroVisible = false;
let cancelLaserAnimation = null;
let cancelMirrorAnimation = null;
let feedbackTimer = null;
let overviewTimer = null;
let overviewExitTimer = null;

function setStatus(state, kicker, title, detail) {
    statusCard.dataset.state = state;
    statusKicker.textContent = kicker;
    statusTitle.textContent = title;
    statusDetail.textContent = detail;
}

function updateStatus(simulation) {
    if (isCampaignIntroVisible) {
        setStatus('active', 'ROUTE MAP', 'See the handoff', 'The first level is coming into focus.');
        return;
    }

    if (!beamVisible || !simulation) {
        setStatus('active', 'AWAITING FIRE', 'Aim the mirrors', 'The beam is hidden until you fire the laser.');
        return;
    }

    if (isAnimating) {
        setStatus('active', 'BEAM IN TRANSIT', 'Tracing the route', 'Watch the beam move through each cell.');
        return;
    }

    if (isCoolingDown) {
        setStatus('blocked', 'ATTEMPT RECORDED', 'Beam fading', 'The next attempt unlocks when the route clears.');
        return;
    }

    const states = {
        target: ['won', 'TRANSMISSION COMPLETE', 'Target acquired', 'A clean line reached the receiver.'],
        boundary: ['blocked', 'ATTEMPT FAILED', 'Beam left the board', 'Rotate a mirror and try again.'],
        wall: ['blocked', 'ATTEMPT FAILED', 'Beam blocked', 'A wall interrupted the transmission.'],
        loop: ['loop', 'ATTEMPT FAILED', 'Loop detected', 'The beam repeated a path. Try another angle.'],
        'wrong-target-direction': ['blocked', 'ATTEMPT FAILED', 'Wrong portal direction', 'The target portal rejected that approach.'],
        'source-reentry': ['loop', 'ATTEMPT FAILED', 'Source portal re-entry', 'The beam returned to its source.'],
        'portal-loop': ['loop', 'ATTEMPT FAILED', 'Portal loop detected', 'The beam repeated a portal path.'],
        'step-limit': ['loop', 'ATTEMPT FAILED', 'Route limit reached', 'The beam exceeded the safe trace limit. Try another angle.'],
    };
    const [state, kicker, title, detail] = states[simulation.terminalReason] ?? states.boundary;
    setStatus(state, kicker, title, detail);
}

function updateLives() {
    livesRow.setAttribute('aria-label', `${lives} ${lives === 1 ? 'life' : 'lives'} remaining`);
    livesRow.querySelectorAll('.heart').forEach((heart) => {
        const filled = Number(heart.dataset.life) <= lives;
        heart.classList.toggle('is-filled', filled);
        heart.textContent = filled ? '♥' : '♡';
    });
}

function currentDifficultyLevels() {
    return levelsByDifficulty[difficultyId] ?? [];
}

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function portalFor(levelData, role) {
    return levelData.portals?.find((portal) => portal.role === role)
        ?? (role === 'source' ? levelData.source : levelData.target);
}

function portalEdge(portal, size) {
    if (portal.row === 0) return 'north';
    if (portal.row === size - 1) return 'south';
    if (portal.col === 0) return 'west';
    if (portal.col === size - 1) return 'east';
    return 'inner';
}

function portalSlot(portal, size) {
    const edge = portalEdge(portal, size);
    if (edge === 'north' || edge === 'south') return portal.col + 1;
    if (edge === 'east' || edge === 'west') return portal.row + 1;
    return null;
}

function portalSlotLabel(portal, size) {
    const slot = portalSlot(portal, size);
    return slot === null ? 'inner' : `slot ${String(slot).padStart(2, '0')}/${String(size).padStart(2, '0')}`;
}

function directionArrow(direction) {
    return DIRECTION_ARROWS[direction] ?? '•';
}

function setIntroFocusMode(active) {
    [skipLink, brandLink].forEach((element) => {
        if (!element) return;
        if (active) element.setAttribute('tabindex', '-1');
        else element.removeAttribute('tabindex');
    });
}

function createRouteThumbnail(levelData) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'route-thumb';
    thumbnail.setAttribute('aria-hidden', 'true');
    thumbnail.style.setProperty('--mini-size', levelData.size);

    const portals = levelData.portals ?? [levelData.source, levelData.target];
    const portalByKey = new Map(portals.map((portal) => [`${portal.row}-${portal.col}`, portal]));
    const wallKeys = new Set(levelData.walls.map((wall) => `${wall.row}-${wall.col}`));
    const mirrorByKey = new Map(levelData.mirrors.map((mirror) => [`${mirror.row}-${mirror.col}`, mirror]));

    for (let row = 0; row < levelData.size; row += 1) {
        for (let col = 0; col < levelData.size; col += 1) {
            const cell = document.createElement('span');
            const key = `${row}-${col}`;
            cell.className = 'route-thumb-cell';
            if (wallKeys.has(key)) cell.classList.add('is-wall');
            const mirror = mirrorByKey.get(key);
            if (mirror) {
                cell.classList.add('is-mirror', mirror.orientation === '/' ? 'is-slash' : 'is-backslash');
            }

            const portal = portalByKey.get(key);
            if (portal) {
                cell.classList.add(portal.role === 'target' ? 'is-target' : 'is-source');
                cell.textContent = directionArrow(portal.facingDirection ?? portal.direction);
            }
            thumbnail.appendChild(cell);
        }
    }

    return thumbnail;
}

function createRouteNode(levelData, index) {
    const sourcePortal = portalFor(levelData, 'source');
    const targetPortal = portalFor(levelData, 'target');
    const node = document.createElement('article');
    node.className = `route-node${index === 0 ? ' is-first' : ''}`;
    node.setAttribute('role', 'listitem');

    const header = document.createElement('div');
    header.className = 'route-node-header';
    const number = document.createElement('span');
    number.className = 'route-node-number';
    number.textContent = `0${index + 1}`;
    const label = document.createElement('span');
    label.className = 'route-node-label';
    label.textContent = `LEVEL ${index + 1}`;
    header.append(number, label);

    const name = document.createElement('h3');
    name.className = 'route-node-name';
    name.textContent = levelData.name;

    const size = document.createElement('span');
    size.className = 'route-node-size';
    size.textContent = `${levelData.size} × ${levelData.size}`;

    const edges = document.createElement('div');
    edges.className = 'route-node-edges';
    const sourceEdge = document.createElement('span');
    sourceEdge.textContent = `SOURCE ${EDGE_LABELS[portalEdge(sourcePortal, levelData.size)] ?? 'INNER'} ${directionArrow(sourcePortal.direction ?? sourcePortal.facingDirection)}`;
    const targetEdge = document.createElement('span');
    targetEdge.textContent = `TARGET ${EDGE_LABELS[portalEdge(targetPortal, levelData.size)] ?? 'INNER'} ${directionArrow(targetPortal.facingDirection ?? targetPortal.direction)}`;
    edges.append(sourceEdge, targetEdge);

    node.append(header, name, size, createRouteThumbnail(levelData), edges);
    return node;
}

function createRouteConnector(fromLevel, toLevel) {
    const connector = document.createElement('div');
    connector.className = 'route-connector';
    connector.setAttribute('role', 'listitem');
    const fromPortal = portalFor(fromLevel, 'target');
    const toPortal = portalFor(toLevel, 'source');
    const fromEdge = EDGE_LABELS[portalEdge(fromPortal, fromLevel.size)] ?? 'INNER';
    const toEdge = EDGE_LABELS[portalEdge(toPortal, toLevel.size)] ?? 'INNER';
    const fromDirection = fromPortal.facingDirection ?? fromPortal.direction;
    const toDirection = toPortal.direction ?? toPortal.facingDirection;
    const accessibleLabel = document.createElement('span');
    accessibleLabel.className = 'route-handoff-accessible';
    accessibleLabel.setAttribute('role', 'img');
    accessibleLabel.setAttribute('aria-label', `Target ${fromEdge.toLowerCase()} ${directionArrow(fromDirection)} ${portalSlotLabel(fromPortal, fromLevel.size)} connects to next source ${toEdge.toLowerCase()} ${directionArrow(toDirection)} ${portalSlotLabel(toPortal, toLevel.size)}`);

    const createHandoffPortal = (role, edge, direction, portalData, size) => {
        const portal = document.createElement('span');
        portal.className = `route-handoff-portal route-handoff-${role}`;
        portal.setAttribute('aria-hidden', 'true');
        const glyph = document.createElement('span');
        glyph.className = 'route-handoff-glyph';
        glyph.textContent = directionArrow(direction);
        const label = document.createElement('span');
        label.className = 'route-handoff-label';
        label.textContent = `${role === 'target' ? 'TGT' : 'SRC'} ${edge[0]} · ${portalSlotLabel(portalData, size).replace('slot ', '')}`;
        portal.append(glyph, label);
        return portal;
    };

    const bridge = document.createElement('span');
    bridge.className = 'route-handoff-bridge';
    bridge.setAttribute('aria-hidden', 'true');
    const line = document.createElement('span');
    line.className = 'route-handoff-line';
    const arrow = document.createElement('span');
    arrow.className = 'route-handoff-arrow';
    arrow.textContent = '›';
    arrow.setAttribute('aria-hidden', 'true');
    bridge.append(line, arrow);

    connector.append(
        accessibleLabel,
        createHandoffPortal('target', fromEdge, fromDirection, fromPortal, fromLevel.size),
        bridge,
        createHandoffPortal('source', toEdge, toDirection, toPortal, toLevel.size),
    );
    return connector;
}

function renderCampaignOverview() {
    const difficultyLevels = currentDifficultyLevels();
    campaignOverviewKicker.textContent = `${DIFFICULTY_LABELS[difficultyId].toUpperCase()} ROUTE MAP`;
    campaignOverviewTitle.textContent = 'Follow the handoff.';
    routeMapElement.replaceChildren();
    difficultyLevels.forEach((levelData, index) => {
        routeMapElement.appendChild(createRouteNode(levelData, index));
        if (index < difficultyLevels.length - 1) {
            routeMapElement.appendChild(createRouteConnector(levelData, difficultyLevels[index + 1]));
        }
    });
}

function clearOverviewTimers() {
    if (overviewTimer !== null) window.clearTimeout(overviewTimer);
    if (overviewExitTimer !== null) window.clearTimeout(overviewExitTimer);
    overviewTimer = null;
    overviewExitTimer = null;
    campaignOverview.hidden = true;
    campaignOverview.classList.remove('is-exiting');
    boardWrap.classList.remove('is-board-zooming');
}

function startCampaignOverview() {
    clearOverviewTimers();
    renderCampaignOverview();
    campaignOverview.hidden = false;
    campaignOverview.focus();

    overviewTimer = window.setTimeout(() => {
        campaignOverview.classList.add('is-exiting');
        boardWrap.classList.add('is-board-zooming');
        overviewExitTimer = window.setTimeout(() => {
            campaignOverview.hidden = true;
            campaignOverview.classList.remove('is-exiting');
            boardWrap.classList.remove('is-board-zooming');
            isCampaignIntroVisible = false;
            overviewExitTimer = null;
            render();
            fireButton.focus();
        }, prefersReducedMotion() ? 0 : 700);
        overviewTimer = null;
    }, prefersReducedMotion() ? 650 : 1250);
}

function updateDifficultyTabs() {
    difficultyTabs.forEach((tab) => {
        const active = tab.dataset.difficulty === difficultyId;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-pressed', String(active));
        tab.disabled = isAnimating || isCoolingDown || isSolved || isCampaignIntroVisible || !levels.length;
    });
}

function updateProgress() {
    const difficultyLabel = DIFFICULTY_LABELS[difficultyId].toUpperCase();
    const levelNumber = levelIndex + 1;
    levelTagElement.textContent = `${difficultyLabel} · LEVEL ${levelNumber} / ${LEVELS_PER_DIFFICULTY}`;
    levelProgressElement.textContent = `LEVEL ${levelNumber} / ${LEVELS_PER_DIFFICULTY}`;
}

function createState() {
    return createInitialState(level);
}

function render({ animatedMirrorId = null } = {}) {
    if (!level || !boardState) return;

    const visibleSimulation = beamVisible && lastSimulation ? lastSimulation : EMPTY_SIMULATION;
    const elements = renderBoard({
        boardElement,
        beamLayer,
        level,
        boardState,
        simulation: visibleSimulation,
        showTrace: beamVisible && !isAnimating,
        onMirrorActivate: rotateMirror,
    });

    updateProgress();
    levelNameElement.textContent = level.name.toUpperCase();
    boardSizeElement.textContent = `${level.size} × ${level.size} GRID`;
    boardElement.setAttribute('aria-label', `${level.size} by ${level.size} laser puzzle board`);
    updateLives();
    setIntroFocusMode(isCampaignIntroVisible);
    fireButton.disabled = isAnimating || isCoolingDown || isSolved || isCampaignIntroVisible || lives === 0;
    resetButton.disabled = isAnimating || isSolved || isCampaignIntroVisible;
    boardWrap.dataset.terminalReason = visibleSimulation.terminalReason ?? '';
    updateStatus(lastSimulation);

    elements.mirrorButtons.forEach((mirrorButton) => {
        mirrorButton.disabled = isAnimating || isCoolingDown || isSolved || isCampaignIntroVisible || lives === 0;
    });
    updateDifficultyTabs();
    if (animatedMirrorId) {
        cancelMirrorAnimation?.();
        cancelMirrorAnimation = animateMirror(elements.mirrorButtons.get(animatedMirrorId));
    }
    if (!isAnimating) animateTarget(elements.targetElement, visibleSimulation.targetHit);
}

function rotateMirror(mirrorId) {
    if (isAnimating || isCoolingDown || isSolved || lives === 0) return;

    const mirror = boardState.mirrors.find((candidate) => candidate.id === mirrorId);
    if (!mirror || !mirror.rotatable) return;

    mirror.orientation = mirror.orientation === '/' ? '\\' : '/';
    beamVisible = false;
    lastSimulation = null;
    render({ animatedMirrorId: mirrorId });
}

function clearFeedbackTimer() {
    if (feedbackTimer !== null) window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
}

function loadLevelAt(nextLevelIndex, { focusFire = true, showOverview = false } = {}) {
    clearOverviewTimers();
    const difficultyLevels = currentDifficultyLevels();
    levelIndex = nextLevelIndex;
    level = difficultyLevels[levelIndex];
    if (!level) throw new Error(`Missing ${difficultyId} level ${levelIndex + 1}`);

    boardState = createState();
    beamVisible = false;
    lastSimulation = null;
    isAnimating = false;
    isCoolingDown = false;
    isSolved = false;
    isCampaignIntroVisible = showOverview;
    winOverlay.hidden = true;
    appShell.inert = false;
    render();
    if (showOverview) startCampaignOverview();
    else if (focusFire) fireButton.focus();
}

function groupLevels(campaignLevels) {
    const grouped = Object.fromEntries(DIFFICULTIES.map((id) => [id, []]));
    campaignLevels.forEach((campaignLevel) => {
        if (grouped[campaignLevel.difficulty]) grouped[campaignLevel.difficulty].push(campaignLevel);
    });
    DIFFICULTIES.forEach((id) => {
        grouped[id].sort((first, second) => first.id.localeCompare(second.id, undefined, { numeric: true }));
        if (grouped[id].length !== LEVELS_PER_DIFFICULTY) {
            throw new Error(`${DIFFICULTY_LABELS[id]} requires exactly ${LEVELS_PER_DIFFICULTY} levels`);
        }
    });
    return grouped;
}

function selectDifficulty(nextDifficultyId) {
    if (!levelsByDifficulty[nextDifficultyId] || isAnimating || isCoolingDown) return;
    clearFeedbackTimer();
    difficultyId = nextDifficultyId;
    lives = MAX_LIVES;
    loadLevelAt(0, { focusFire: false, showOverview: true });
}

function showDifficultyComplete() {
    const isFinalDifficulty = difficultyId === DIFFICULTIES.at(-1);
    isSolved = true;
    render();
    winKicker.textContent = isFinalDifficulty ? 'CAMPAIGN COMPLETE' : 'DIFFICULTY CLEARED';
    winTitle.innerHTML = isFinalDifficulty ? 'All lines<br><em>aligned.</em>' : `${DIFFICULTY_LABELS[difficultyId]}<br><em>cleared.</em>`;
    winCopy.innerHTML = isFinalDifficulty
        ? 'Every route is online. You completed the full three-difficulty campaign.'
        : `All three ${DIFFICULTY_LABELS[difficultyId]} routes are online. Ready for the next challenge?`;
    nextDifficultyButton.hidden = isFinalDifficulty;
    nextDifficultyButton.disabled = isFinalDifficulty;
    playAgainButton.textContent = `Replay ${DIFFICULTY_LABELS[difficultyId]}`;
    const replayIcon = document.createElement('span');
    replayIcon.setAttribute('aria-hidden', 'true');
    replayIcon.textContent = '↺';
    playAgainButton.append(' ', replayIcon);
    appShell.inert = true;
    winOverlay.hidden = false;
    (isFinalDifficulty ? playAgainButton : nextDifficultyButton).focus();
}

function finishAttempt() {
    cancelLaserAnimation = null;
    isAnimating = false;

    if (lastSimulation?.targetHit) {
        isSolved = true;
        render();
        feedbackTimer = window.setTimeout(() => {
            if (levelIndex < LEVELS_PER_DIFFICULTY - 1) {
                loadLevelAt(levelIndex + 1);
            } else {
                showDifficultyComplete();
            }
            feedbackTimer = null;
        }, 720);
        return;
    }

    isCoolingDown = true;
    feedbackTimer = window.setTimeout(() => {
        isCoolingDown = false;
        lives -= 1;
        if (lives === 0) {
            levelIndex = 0;
            level = currentDifficultyLevels()[levelIndex];
            boardState = createState();
            lives = MAX_LIVES;
        }
        beamVisible = false;
        lastSimulation = null;
        render();
        fireButton.focus();
        feedbackTimer = null;
    }, 1400);
    render();
}

function fireLaser() {
    if (isAnimating || isCoolingDown || isSolved || lives === 0 || !level) return;

    beamVisible = true;
    lastSimulation = simulate(boardState);
    isAnimating = true;
    render();
    cancelLaserAnimation = animateLaser(beamLayer, lastSimulation.beamPath, {
        onComplete: finishAttempt,
    });
}

function resetGame() {
    if (!level) return;
    cancelLaserAnimation?.();
    cancelLaserAnimation = null;
    cancelMirrorAnimation?.();
    cancelMirrorAnimation = null;
    clearFeedbackTimer();
    clearOverviewTimers();
    boardState = createState();
    lastSimulation = null;
    beamVisible = false;
    isAnimating = false;
    isCoolingDown = false;
    isSolved = false;
    isCampaignIntroVisible = false;
    winOverlay.hidden = true;
    appShell.inert = false;
    render();
    fireButton.focus();
}

function playAgain() {
    clearFeedbackTimer();
    lives = MAX_LIVES;
    loadLevelAt(0, { focusFire: false, showOverview: true });
}

function advanceDifficulty() {
    const nextIndex = DIFFICULTIES.indexOf(difficultyId) + 1;
    if (nextIndex < DIFFICULTIES.length) selectDifficulty(DIFFICULTIES[nextIndex]);
}

function showLoadError(error) {
    setStatus('blocked', 'LOAD ERROR', 'Levels unavailable', error.message);
    fireButton.disabled = true;
    resetButton.disabled = true;
    difficultyTabs.forEach((tab) => { tab.disabled = true; });
}

function keepIntroFocus(event) {
    if (!isCampaignIntroVisible || event.key !== 'Tab') return;
    event.preventDefault();
    campaignOverview.focus();
}

async function initialize() {
    try {
        levels = await loadMvpLevel();
        levelsByDifficulty = groupLevels(levels);
        difficultyId = DIFFICULTIES[0];
        levelIndex = 0;
        level = currentDifficultyLevels()[levelIndex];
        boardState = createState();
        isCampaignIntroVisible = true;
        render();
        startCampaignOverview();
    } catch (error) {
        showLoadError(error);
    }
}

difficultyTabs.forEach((tab) => {
    tab.addEventListener('click', () => selectDifficulty(tab.dataset.difficulty));
});
document.addEventListener('keydown', keepIntroFocus);
fireButton.addEventListener('click', fireLaser);
resetButton.addEventListener('click', resetGame);
nextDifficultyButton.addEventListener('click', advanceDifficulty);
playAgainButton.addEventListener('click', playAgain);
initialize();
