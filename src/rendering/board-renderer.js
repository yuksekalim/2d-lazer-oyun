const ORIENTATION_LABELS = ['northwest ↗', 'northeast ↘', 'northwest ↗', 'northeast ↘'];

const sameCell = (a, b) => a && b && a.row === b.row && a.col === b.col;

const cellKey = ({ row, col }) => `${row}-${col}`;

const createCell = (row, col, size) => {
    const cell = document.createElement('div');
    cell.className = 'board-cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.setAttribute('role', 'gridcell');
    cell.style.setProperty('--cell-index', row * size + col);
    return cell;
};

const createBeam = (beamLayer, path, size) => {
    beamLayer.replaceChildren();
    beamLayer.setAttribute('viewBox', `0 0 ${size} ${size}`);

    if (!path || path.length < 2) return null;

    const points = path.map(({ row, col }) => `${col + 0.5},${row + 0.5}`).join(' ');
    const beam = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    beam.classList.add('beam-line');
    beam.setAttribute('points', points);
    beam.setAttribute('pathLength', '1');
    beamLayer.appendChild(beam);

    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pulse.classList.add('beam-pulse');
    pulse.setAttribute('points', points);
    pulse.setAttribute('pathLength', '1');
    beamLayer.appendChild(pulse);

    return beamLayer;
};

export function renderBoard({ boardElement, beamLayer, level, boardState, simulation }) {
    const { size, source, target, walls } = level;
    const mirrors = boardState.mirrors;
    const wallKeys = new Set(walls.map(cellKey));
    const mirrorByKey = new Map(mirrors.map((mirror) => [cellKey(mirror), mirror]));
    const beamKeys = new Set((simulation.beamPath || []).map(cellKey));
    const mirrorButtons = new Map();
    let targetElement = null;

    boardElement.replaceChildren();
    boardElement.style.setProperty('--grid-size', size);

    for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
            const position = { row, col };
            const key = cellKey(position);
            const cell = createCell(row, col, size);

            if (wallKeys.has(key)) {
                cell.classList.add('is-wall');
                cell.innerHTML = '<span class="wall-glyph" aria-hidden="true"></span>';
            }

            if (sameCell(position, source)) {
                cell.classList.add('is-source');
                cell.innerHTML = '<span class="source-glyph" aria-hidden="true"><span></span></span>';
                cell.setAttribute('aria-label', 'Laser emitter, pointing right');
            }

            if (sameCell(position, target)) {
                cell.classList.add('is-target');
                cell.innerHTML = '<span class="target-glyph" aria-hidden="true"><span></span></span>';
                cell.setAttribute('aria-label', simulation.targetHit ? 'Receiver, hit' : 'Receiver, not hit');
                targetElement = cell;
                if (simulation.targetHit) cell.classList.add('target-hit');
            }

            const mirror = mirrorByKey.get(key);
            if (mirror) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'mirror-button';
                button.dataset.mirrorId = mirror.id;
                button.setAttribute('aria-label', `Mirror ${mirror.label}, orientation ${mirror.orientation + 1} of 4. Activate to rotate clockwise.`);
                button.title = `Rotate ${mirror.label}`;
                button.innerHTML = `<span class="mirror-glyph" style="--mirror-angle: ${mirror.orientation * 90}deg"><span></span></span><span class="mirror-index">${mirror.label.slice(0, 1)}</span>`;
                cell.appendChild(button);
                mirrorButtons.set(mirror.id, button);
            }

            if (beamKeys.has(key)) cell.classList.add('beam-trace');
            boardElement.appendChild(cell);
        }
    }

    createBeam(beamLayer, simulation.beamPath, size);
    return { mirrorButtons, targetElement };
}

export function orientationLabel(orientation) {
    return ORIENTATION_LABELS[orientation % ORIENTATION_LABELS.length];
}
