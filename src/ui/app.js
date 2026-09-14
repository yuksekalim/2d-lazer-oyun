import { animateLaser } from '../animation/laser-animation.js';
import { animateMirror } from '../animation/mirror-animation.js';
import { animateTarget } from '../animation/target-animation.js';
import { renderBoard } from '../rendering/board-renderer.js';
import { createInitialState, loadMvpLevel, simulate } from './physics-adapter.js';

const MAX_LIVES = 3;
const EMPTY_SIMULATION = Object.freeze({ beamPath: [], targetHit: false, terminalReason: null });

const boardElement = document.querySelector('#game-board');
const boardWrap = document.querySelector('#board-wrap');
const beamLayer = document.querySelector('#beam-layer');
const levelTagElement = document.querySelector('#level-tag');
const boardSizeElement = document.querySelector('#board-size');
const livesRow = document.querySelector('#lives-row');
const missionLivesElement = document.querySelector('#mission-lives');
const statusCard = document.querySelector('#status-card');
const statusKicker = document.querySelector('#status-kicker');
const statusTitle = document.querySelector('#status-title');
const statusDetail = document.querySelector('#status-detail');
const fireButton = document.querySelector('#fire-button');
const resetButton = document.querySelector('#reset-button');
const winOverlay = document.querySelector('#win-overlay');
const playAgainButton = document.querySelector('#play-again-button');

let levels = [];
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
    missionLivesElement.textContent = lives;
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

    levelTagElement.textContent = level.name.toUpperCase();
    boardSizeElement.textContent = `${level.size} × ${level.size} GRID`;
    boardElement.setAttribute('aria-label', `${level.size} by ${level.size} laser puzzle board`);
    updateLives();
    fireButton.disabled = isAnimating || isCoolingDown || isSolved || lives === 0;
    resetButton.disabled = isAnimating;
    boardWrap.dataset.terminalReason = visibleSimulation.terminalReason ?? '';
    updateStatus(lastSimulation);

    elements.mirrorButtons.forEach((mirrorButton) => {
        mirrorButton.disabled = isAnimating || isCoolingDown || isSolved || lives === 0;
    });
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

function finishAttempt() {
    cancelLaserAnimation = null;
    isAnimating = false;

    if (lastSimulation?.targetHit) {
        isSolved = true;
        render();
        feedbackTimer = window.setTimeout(() => {
            if (levelIndex < levels.length - 1) {
                levelIndex += 1;
                level = levels[levelIndex];
                boardState = createState();
                beamVisible = false;
                lastSimulation = null;
                isSolved = false;
                render();
                fireButton.focus();
            } else {
                winOverlay.hidden = false;
                playAgainButton.focus();
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
            level = levels[levelIndex];
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
    render();
    fireButton.focus();
}

function playAgain() {
    clearFeedbackTimer();
    lives = MAX_LIVES;
    levelIndex = 0;
    level = levels[levelIndex];
    resetGame();
}

function showLoadError(error) {
    setStatus('blocked', 'LOAD ERROR', 'Levels unavailable', error.message);
    fireButton.disabled = true;
    resetButton.disabled = true;
}

async function initialize() {
    try {
        levels = await loadMvpLevel();
        levelIndex = 0;
        level = levels[levelIndex];
        boardState = createState();
        levelTagElement.textContent = level.name.toUpperCase();
        boardSizeElement.textContent = `${level.size} × ${level.size} GRID`;
        boardElement.setAttribute('aria-label', `${level.size} by ${level.size} laser puzzle board`);
        render();
    } catch (error) {
        showLoadError(error);
    }
}

fireButton.addEventListener('click', fireLaser);
resetButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', playAgain);
initialize();
