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
    boardWrap.dataset.terminalReason = lastSimulation.terminalReason;
    updateStatus(lastSimulation);
    animateLaser(beamLayer);

    if (animatedMirrorId) animateMirror(elements.mirrorButtons.get(animatedMirrorId));
    animateTarget(elements.targetElement, lastSimulation.targetHit);

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
    render({ animatedMirrorId: mirrorId });
}

function resetGame() {
    boardState = createInitialState();
    moveCount = 0;
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
