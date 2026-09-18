import { animateLaser } from '../animation/laser-animation.js?v=30-campaign-final';
import { animateMirror } from '../animation/mirror-animation.js?v=30-campaign-final';
import { animateTarget } from '../animation/target-animation.js?v=30-campaign-final';
import { renderBoard } from '../rendering/board-renderer.js?v=30-campaign-final';
import { createInitialState, loadMvpLevel, simulate } from './physics-adapter.js?v=30-campaign-final';

const MAX_LIVES = 3;
const LEVELS_PER_DIFFICULTY = 10;
const DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard']);
const DIFFICULTY_LABELS = Object.freeze({ easy: 'Easy', medium: 'Medium', hard: 'Hard' });
const DIFFICULTY_BOARD_SIZES = Object.freeze({ easy: 7, medium: 11, hard: 15 });
const EMPTY_SIMULATION = Object.freeze({ beamPath: [], targetHit: false, terminalReason: null });

const boardElement = document.querySelector('#game-board');
const boardWrap = document.querySelector('#board-wrap');
const appShell = document.querySelector('.app-shell');
const beamLayer = document.querySelector('#beam-layer');
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
let cancelLaserAnimation = null;
let cancelMirrorAnimation = null;
let feedbackTimer = null;

function setStatus(state, kicker, title, detail) {
    statusCard.dataset.state = state;
    statusKicker.textContent = kicker;
    statusTitle.textContent = title;
    statusDetail.textContent = detail;
}

function updateStatus(simulation) {
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

function updateDifficultyTabs() {
    difficultyTabs.forEach((tab) => {
        const active = tab.dataset.difficulty === difficultyId;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-checked', String(active));
        tab.disabled = isAnimating || isCoolingDown || isSolved || !levels.length;
    });
}

function updateProgress() {
    const difficultyLabel = DIFFICULTY_LABELS[difficultyId].toUpperCase();
    const levelNumber = levelIndex + 1;
    const formattedLevel = String(levelNumber).padStart(2, '0');
    const formattedTotal = String(LEVELS_PER_DIFFICULTY).padStart(2, '0');
    levelTagElement.textContent = `${difficultyLabel} · LEVEL ${formattedLevel} / ${formattedTotal}`;
    levelProgressElement.textContent = `LEVEL ${formattedLevel} / ${formattedTotal}`;
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
    fireButton.disabled = isAnimating || isCoolingDown || isSolved || lives === 0;
    resetButton.disabled = isAnimating || isSolved;
    boardWrap.dataset.terminalReason = visibleSimulation.terminalReason ?? '';
    updateStatus(lastSimulation);

    elements.mirrorButtons.forEach((mirrorButton) => {
        mirrorButton.disabled = isAnimating || isCoolingDown || isSolved || lives === 0;
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

function loadLevelAt(nextLevelIndex, { focusFire = true } = {}) {
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
    winOverlay.hidden = true;
    appShell.inert = false;
    render();
    if (focusFire) fireButton.focus();
}

function groupLevels(campaignLevels) {
    const grouped = Object.fromEntries(DIFFICULTIES.map((id) => [id, []]));
    campaignLevels.forEach((campaignLevel) => {
        if (grouped[campaignLevel.difficulty]) grouped[campaignLevel.difficulty].push(campaignLevel);
    });
    DIFFICULTIES.forEach((id) => {
        grouped[id].sort((first, second) => first.id.localeCompare(second.id, undefined, { numeric: true }));
        const expectedIds = Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, index) => `${id}_${String(index + 1).padStart(2, '0')}`);
        const actualIds = new Set(grouped[id].map((campaignLevel) => campaignLevel.id));
        const hasExpectedIds = expectedIds.every((expectedId) => actualIds.has(expectedId));
        const hasExpectedSize = grouped[id].every((campaignLevel) => campaignLevel.size === DIFFICULTY_BOARD_SIZES[id]);
        if (grouped[id].length !== LEVELS_PER_DIFFICULTY || actualIds.size !== LEVELS_PER_DIFFICULTY || !hasExpectedIds || !hasExpectedSize) {
            throw new Error(`${DIFFICULTY_LABELS[id]} requires exactly ${LEVELS_PER_DIFFICULTY} levels`);
        }
    });
    return grouped;
}

function selectDifficulty(nextDifficultyId, { focusFire = false } = {}) {
    if (!levelsByDifficulty[nextDifficultyId] || isAnimating || isCoolingDown) return;
    clearFeedbackTimer();
    difficultyId = nextDifficultyId;
    lives = MAX_LIVES;
    loadLevelAt(0, { focusFire });
}

function showDifficultyComplete() {
    const isFinalDifficulty = difficultyId === DIFFICULTIES.at(-1);
    isSolved = true;
    render();
    winKicker.textContent = isFinalDifficulty ? 'CAMPAIGN COMPLETE' : 'DIFFICULTY CLEARED';
    winTitle.innerHTML = isFinalDifficulty ? 'All lines<br><em>aligned.</em>' : `${DIFFICULTY_LABELS[difficultyId]}<br><em>cleared.</em>`;
    winCopy.innerHTML = isFinalDifficulty
        ? 'Every route is online. You completed the full thirty-level campaign.'
        : `All ten ${DIFFICULTY_LABELS[difficultyId]} routes are online. Ready for the next challenge?`;
    nextDifficultyButton.hidden = isFinalDifficulty;
    nextDifficultyButton.disabled = isFinalDifficulty;
    const replayIcon = document.createElement('span');
    replayIcon.className = 'action-icon action-icon-reset';
    replayIcon.setAttribute('aria-hidden', 'true');
    playAgainButton.replaceChildren(document.createTextNode(`Replay ${DIFFICULTY_LABELS[difficultyId]}`), replayIcon);
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
    boardState = createState();
    lastSimulation = null;
    beamVisible = false;
    isAnimating = false;
    isCoolingDown = false;
    isSolved = false;
    winOverlay.hidden = true;
    appShell.inert = false;
    render();
    fireButton.focus();
}

function playAgain() {
    clearFeedbackTimer();
    lives = MAX_LIVES;
    loadLevelAt(0);
}

function advanceDifficulty() {
    const nextIndex = DIFFICULTIES.indexOf(difficultyId) + 1;
    if (nextIndex < DIFFICULTIES.length) selectDifficulty(DIFFICULTIES[nextIndex], { focusFire: true });
}

function showLoadError(error) {
    setStatus('blocked', 'LOAD ERROR', 'Levels unavailable', error.message);
    fireButton.disabled = true;
    resetButton.disabled = true;
    difficultyTabs.forEach((tab) => { tab.disabled = true; });
}

async function initialize() {
    try {
        levels = await loadMvpLevel();
        levelsByDifficulty = groupLevels(levels);
        difficultyId = DIFFICULTIES[0];
        loadLevelAt(0);
    } catch (error) {
        showLoadError(error);
    }
}

difficultyTabs.forEach((tab) => {
    tab.addEventListener('click', () => selectDifficulty(tab.dataset.difficulty));
    tab.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const currentIndex = difficultyTabs.indexOf(tab);
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? difficultyTabs.length - 1
                : (currentIndex + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + difficultyTabs.length) % difficultyTabs.length;
        const nextTab = difficultyTabs[nextIndex];
        nextTab.focus();
        selectDifficulty(nextTab.dataset.difficulty);
    });
});
fireButton.addEventListener('click', fireLaser);
resetButton.addEventListener('click', resetGame);
nextDifficultyButton.addEventListener('click', advanceDifficulty);
playAgainButton.addEventListener('click', playAgain);
initialize();
