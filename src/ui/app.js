import { animateLaser } from '../animation/laser-animation.js';
import { animateMirror } from '../animation/mirror-animation.js';
import { animateTarget } from '../animation/target-animation.js';
import { bindMirrorInput } from '../input/mirror-input.js';
import { renderBoard } from '../rendering/board-renderer.js';
import { createInitialState, loadMvpLevel, simulate } from './physics-adapter.js';

const MAX_LIVES = 3;
const EMPTY_SIMULATION = Object.freeze({ beamPath: [], targetHit: false, terminalReason: null });

const boardElement = document.querySelector('#game-board');
const boardWrap = document.querySelector('#board-wrap');
const beamLayer = document.querySelector('#beam-layer');
const levelTagElement = document.querySelector('#level-tag');
const boardSizeElement = document.querySelector('#board-size');
const livesElement = document.querySelector('#lives');
const statusCard = document.querySelector('#status-card');
const statusKicker = document.querySelector('#status-kicker');
const statusTitle = document.querySelector('#status-title');
const statusDetail = document.querySelector('#status-detail');
const fireButton = document.querySelector('#fire-button');
const resetButton = document.querySelector('#reset-button');
const winOverlay = document.querySelector('#win-overlay');
const playAgainButton = document.querySelector('#play-again-button');
const winResetButton = document.querySelector('#win-reset-button');

let level = null;
let boardState = null;
let lastSimulation = null;
let lives = MAX_LIVES;
let beamVisible = false;
let isAnimating = false;
let isSolved = false;
let cancelLaserAnimation = null;

function createState() {
    return createInitialState(level);
}

function updateStatus(simulation) {
    if (!beamVisible || !simulation) {
        statusCard.dataset.state = 'active';
        statusKicker.textContent = 'AWAITING FIRE';
        statusTitle.textContent = 'Aim the mirrors';
        statusDetail.textContent = 'The beam is hidden until you fire the laser.';
        return;
    }

    if (isAnimating) {
        statusCard.dataset.state = 'active';
        statusKicker.textContent = 'BEAM IN TRANSIT';
        statusTitle.textContent = 'Tracing the route';
        statusDetail.textContent = 'Watch the beam move through each cell.';
        return;
    }

    const states = {
        target: ['won', 'TRANSMISSION COMPLETE', 'Target acquired', 'A clean line reached the receiver.'],
        boundary: ['blocked', 'ATTEMPT FAILED', 'Beam left the board', 'Rotate a mirror and try again.'],
        wall: ['blocked', 'ATTEMPT FAILED', 'Beam blocked', 'A wall interrupted the transmission.'],
        loop: ['loop', 'ATTEMPT FAILED', 'Loop detected', 'The beam repeated a path. Try another angle.'],
        'step-limit': ['blocked', 'ATTEMPT FAILED', 'Beam stopped', 'The route exceeded the safe step limit.'],
    };
    const [state, kicker, title, detail] = states[simulation.terminalReason] ?? states.boundary;
    statusCard.dataset.state = state;
    statusKicker.textContent = kicker;
    statusTitle.textContent = title;
    statusDetail.textContent = detail;
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
    });

    livesElement.textContent = lives;
    fireButton.disabled = isAnimating || isSolved;
    resetButton.disabled = isAnimating;
    boardWrap.dataset.terminalReason = visibleSimulation.terminalReason ?? '';
    updateStatus(lastSimulation);

    if (animatedMirrorId) animateMirror(elements.mirrorButtons.get(animatedMirrorId));
    if (!isAnimating) animateTarget(elements.targetElement, visibleSimulation.targetHit);
}

function rotateMirror(mirrorId) {
    if (isAnimating || isSolved) return;

    const mirror = boardState.mirrors.find((candidate) => candidate.id === mirrorId);
    if (!mirror || !mirror.rotatable) return;

    mirror.orientation = mirror.orientation === '/' ? '\\' : '/';
    beamVisible = false;
    lastSimulation = null;
    render({ animatedMirrorId: mirrorId });
}

function finishAttempt() {
    cancelLaserAnimation = null;
    isAnimating = false;

    if (lastSimulation?.targetHit) {
        isSolved = true;
        render();
        winOverlay.hidden = false;
        playAgainButton.focus();
        return;
    }

    lives -= 1;
    if (lives === 0) {
        boardState = createState();
        lives = MAX_LIVES;
        beamVisible = false;
        lastSimulation = null;
    }
    render();
}

function fireLaser() {
    if (isAnimating || isSolved || !level) return;

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
    boardState = createState();
    lastSimulation = null;
    lives = MAX_LIVES;
    beamVisible = false;
    isAnimating = false;
    isSolved = false;
    winOverlay.hidden = true;
    render();
    fireButton.focus();
}

function showLoadError(error) {
    statusCard.dataset.state = 'blocked';
    statusKicker.textContent = 'LOAD ERROR';
    statusTitle.textContent = 'Level unavailable';
    statusDetail.textContent = error.message;
    fireButton.disabled = true;
    resetButton.disabled = true;
}

async function initialize() {
    try {
        level = await loadMvpLevel();
        boardState = createState();
        levelTagElement.textContent = level.name.toUpperCase();
        boardSizeElement.textContent = `${level.size} × ${level.size} GRID`;
        boardElement.setAttribute('aria-label', `${level.size} by ${level.size} laser puzzle board`);
        render();
    } catch (error) {
        showLoadError(error);
    }
}

bindMirrorInput(boardElement, rotateMirror);
fireButton.addEventListener('click', fireLaser);
resetButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', resetGame);
winResetButton.addEventListener('click', resetGame);

initialize();
