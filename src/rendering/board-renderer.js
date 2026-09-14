const ORIENTATION_LABELS = Object.freeze({ '/': 'slash', '\\': 'backslash' });
const DIRECTION_ARROWS = Object.freeze({ N: '↑', E: '→', S: '↓', W: '←' });

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
    ['beam-line', 'beam-pulse'].forEach((className) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.classList.add(className);
        line.setAttribute('points', points);
        line.setAttribute('pathLength', '1');
        beamLayer.appendChild(line);
    });
    return beamLayer;
};

const portalMarkup = (portal) => {
    const role = portal.role === 'target' ? 'target' : 'source';
    const direction = portal.facingDirection ?? portal.direction;
    const arrow = DIRECTION_ARROWS[direction] ?? '•';
    const color = portal.color === 'orange' ? 'orange' : 'blue';
    const label = role === 'target'
        ? `Orange target portal, accepts a beam traveling ${direction}`
        : `Blue source portal, emits ${direction} into the board`;
    return {
        role,
        color,
        label,
        markup: `<span class="portal-glyph ${role}-portal ${color}-portal" style="--portal-angle: ${direction === 'N' ? 0 : direction === 'E' ? 90 : direction === 'S' ? 180 : 270}deg" aria-hidden="true"><span class="portal-core"></span><span class="portal-arrow">${arrow}</span></span>`,
    };
};

export function renderBoard({ boardElement, beamLayer, level, boardState, simulation, showTrace = true }) {
    const { size, source, target, walls } = level;
    const portals = boardState.portals ?? level.portals ?? [source, target];
    const wallKeys = new Set(walls.map(cellKey));
    const portalByKey = new Map(portals.map((portal) => [cellKey(portal), portal]));
    const mirrorByKey = new Map(boardState.mirrors.map((mirror) => [cellKey(mirror), mirror]));
    const beamKeys = showTrace ? new Set((simulation.beamPath || []).map(cellKey)) : new Set();
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

            const portal = portalByKey.get(key);
            if (portal) {
                const renderedPortal = portalMarkup(portal);
                cell.classList.add('is-portal', `${renderedPortal.role}-portal-cell`);
                cell.innerHTML = renderedPortal.markup;
                cell.setAttribute('aria-label', renderedPortal.label);
                if (renderedPortal.role === 'target') {
                    targetElement = cell;
                    if (simulation.targetHit) cell.classList.add('target-hit');
                }
            }

            if (sameCell(position, source) && !portal) {
                cell.classList.add('is-source');
                cell.innerHTML = '<span class="source-glyph" aria-hidden="true"><span></span></span>';
                cell.setAttribute('aria-label', `Laser emitter, pointing ${source.direction}`);
            }

            const mirror = mirrorByKey.get(key);
            if (mirror) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'mirror-button';
                button.dataset.mirrorId = mirror.id;
                button.setAttribute('aria-label', `Mirror ${mirror.label}, ${ORIENTATION_LABELS[mirror.orientation]} orientation. Activate to rotate.`);
                button.title = `Rotate ${mirror.label}`;
                const mirrorAngle = mirror.orientation === '/' ? 0 : 90;
                button.innerHTML = `<span class="mirror-glyph" style="--mirror-angle: ${mirrorAngle}deg"><span></span></span><span class="mirror-index">${mirror.label.slice(0, 1)}</span>`;
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
    return ORIENTATION_LABELS[orientation] ?? 'unknown';
}
