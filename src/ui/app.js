import { animateLaser } from '../animation/laser-animation.js';
import { animateMirror } from '../animation/mirror-animation.js';
import { animateTarget } from '../animation/target-animation.js';
import { bindMirrorInput } from '../input/mirror-input.js';
import { renderBoard } from '../rendering/board-renderer.js';
import { DEMO_LEVEL, simulatePlaceholder } from './physics-adapter.js';

const boardElement = document.querySelector('#game-board');
const boardWrap = document.querySelector('#board-wrap');
const beamLayer = document.querySelector('#beam-layer');
const moveCountElement = document.querySelector('#move-count');
const livesRow = document.querySelector('#lives-row');
const statusCard = document.querySelector('#status-card');
const statusKicker = document.querySelector('#status-kicker');
const statusTitle = document.querySelector('#status-title');
const statusDetail = document.querySelector('#status-detail');
const resetButton = document.querySelector('#reset-button');
const winOverlay = document.querySelector('#win-overlay');
const winMoves = document.querySelector('#win-moves');
const winResetButton = document.querySelector('#win-reset-button');

let boardState = createInitialState();
let moveCount = 0;
let lives = 3;
let lastSimulation = simulatePlaceholder(boardState);

function createInitialState() {
    return {
        levelId: DEMO_LEVEL.id,
        size: DEMO_LEVEL.size,
        source: DEMO_LEVEL.source,
        target: DEMO_LEVEL.target,
        walls: DEMO_LEVEL.walls,
        mirrors: DEMO_LEVEL.mirrors.map((mirror) => ({ ...mirror })),
    };
}

function updateStatus(simulation) {
    const states = {
        target: {
            state: 'won',
            kicker: 'TRANSMISSION COMPLETE',
            title: 'Target acquired',
            detail: 'A clean line reached the receiver.',
        },
        boundary: {
            state: 'active',
            kicker: 'BEAM STATUS',
            title: 'Searching for a path',
            detail: 'The beam escaped the board. Tune the reflectors.',
        },
        wall: {
            state: 'blocked',
            kicker: 'BEAM STATUS',
            title: 'Beam blocked',
            detail: 'A wall is interrupting the transmission.',
        },
        loop: {
            state: 'loop',
            kicker: 'BEAM STATUS',
            title: 'Loop detected',
            detail: 'The beam is repeating a path. Try another angle.',
        },
    };
    const copy = states[simulation.terminalReason] || states.boundary;
    statusCard.dataset.state = copy.state;
    if (lives === 0 && !simulation.targetHit) {
        statusCard.dataset.state = 'blocked';
        statusKicker.textContent = 'NO ATTEMPTS LEFT';
        statusTitle.textContent = 'Reset to recalibrate';
        statusDetail.textContent = 'The circuit needs a fresh start before you can try again.';
        return;
    }
    statusKicker.textContent = copy.kicker;
    statusTitle.textContent = copy.title;
    statusDetail.textContent = copy.detail;
}

function render({ animatedMirrorId = null } = {}) {
    lastSimulation = simulatePlaceholder(boardState);
    const elements = renderBoard({
        boardElement,
        beamLayer,
        level: DEMO_LEVEL,
        boardState,
        simulation: lastSimulation,
    });

    moveCountElement.textContent = moveCount;
    livesRow.setAttribute('aria-label', `${lives} ${lives === 1 ? 'life' : 'lives'} remaining`);
    livesRow.querySelectorAll('.heart').forEach((heart) => {
        const isFilled = Number(heart.dataset.life) <= lives;
        heart.classList.toggle('is-filled', isFilled);
        heart.textContent = isFilled ? '♥' : '♡';
    });
    boardWrap.dataset.terminalReason = lastSimulation.terminalReason;
    updateStatus(lastSimulation);
    animateLaser(beamLayer);

    if (animatedMirrorId) animateMirror(elements.mirrorButtons.get(animatedMirrorId));
    animateTarget(elements.targetElement, lastSimulation.targetHit);

    elements.mirrorButtons.forEach((mirrorButton) => {
        mirrorButton.disabled = lives === 0 || lastSimulation.targetHit;
        if (lives === 0) mirrorButton.setAttribute('aria-label', 'No attempts remaining. Reset the board to continue.');
    });

    if (lastSimulation.targetHit) {
        winMoves.textContent = moveCount;
        winOverlay.hidden = false;
        winResetButton.focus();
    }
}

function rotateMirror(mirrorId) {
    if (lastSimulation.targetHit) return;

    const mirror = boardState.mirrors.find((candidate) => candidate.id === mirrorId);
    if (!mirror) return;

    mirror.orientation = (mirror.orientation + 1) % 4;
    moveCount += 1;
    const nextSimulation = simulatePlaceholder(boardState);
    if (!nextSimulation.targetHit) lives = Math.max(0, lives - 1);
    render({ animatedMirrorId: mirrorId });
}

function resetGame() {
    boardState = createInitialState();
    moveCount = 0;
    lives = 3;
    winOverlay.hidden = true;
    render();
    boardElement.querySelector('.mirror-button')?.focus();
}

bindMirrorInput(boardElement, rotateMirror);
resetButton.addEventListener('click', resetGame);
winResetButton.addEventListener('click', resetGame);
document.addEventListener('keydown', (event) => {
    const isShortcut = !event.ctrlKey && !event.metaKey && !event.altKey;
    if (event.key.toLowerCase() === 'r' && isShortcut && event.target.tagName !== 'INPUT') resetGame();
    if (event.key === 'Escape' && !winOverlay.hidden) resetGame();
});

render();
