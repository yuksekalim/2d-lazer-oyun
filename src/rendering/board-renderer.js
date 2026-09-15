const ORIENTATION_LABELS = Object.freeze({ '/': 'slash', '\\': 'backslash' });
const DIRECTION_ARROWS = Object.freeze({ N: '↑', E: '→', S: '↓', W: '←' });
const DIRECTION_LABELS = Object.freeze({ N: 'north', E: 'east', S: 'south', W: 'west' });

const sameCell = (a, b) => a && b && a.row === b.row && a.col === b.col;
const cellKey = ({ row, col }) => `${row}-${col}`;

const createCell = (row, col, size) => {
    const cell = document.createElement('div');
    cell.className = 'board-cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-colindex', String(col + 1));
    cell.style.setProperty('--cell-index', row * size + col);
    return cell;
};

const createRow = (row) => {
    const rowElement = document.createElement('div');
    rowElement.className = 'board-row';
    rowElement.setAttribute('role', 'row');
    rowElement.setAttribute('aria-rowindex', String(row + 1));
    return rowElement;
};

const createBeam = (beamLayer, path, size) => {
    beamLayer.replaceChildren();
    beamLayer.setAttribute('viewBox', `0 0 ${size} ${size}`);
    if (!path || path.length < 2) return null;

    const points = path.map(({ row, col }) => `${col + 0.5},${row + 0.5}`).join(' ');
    ['beam-glow', 'beam-line', 'beam-pulse', 'beam-spark'].forEach((className) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.classList.add(className);
        line.setAttribute('points', points);
        line.setAttribute('pathLength', '1');
        beamLayer.appendChild(line);
    });
    return beamLayer;
};

const mirrorAngle = (orientation) => orientation === '/' ? 0 : 90;
const cellLabel = ({ row, col }) => ` at row ${row + 1}, column ${col + 1}`;

const updateMirrorButton = (button, mirror) => {
    const nextAngle = mirrorAngle(mirror.orientation);
    const previousAngle = button.dataset.angle ?? String(nextAngle);
    button.dataset.fromAngle = previousAngle;
    button.dataset.toAngle = String(nextAngle);
    button.dataset.angle = String(nextAngle);
    button.setAttribute('aria-label', `Mirror ${mirror.label}, ${ORIENTATION_LABELS[mirror.orientation]} orientation. Activate to rotate.`);
    button.title = `Rotate ${mirror.label}`;
    button.querySelector('.mirror-glyph').style.transform = `rotate(${nextAngle}deg)`;
};

const portalMarkup = (portal) => {
    const role = portal.role === 'target' ? 'target' : 'source';
    const direction = portal.facingDirection ?? portal.direction;
    const arrow = DIRECTION_ARROWS[direction] ?? '•';
    const color = portal.color === 'orange' ? 'orange' : 'blue';
    const directionLabel = DIRECTION_LABELS[direction] ?? direction;
    const label = role === 'target'
        ? `Orange target portal${cellLabel(portal)}, accepts a beam traveling ${directionLabel}`
        : `Blue source portal${cellLabel(portal)}, emits ${directionLabel} into the board`;
    return {
        role,
        color,
        label,
        markup: `<span class="portal-glyph ${role}-portal ${color}-portal" style="--portal-angle: ${direction === 'N' ? 0 : direction === 'E' ? 90 : direction === 'S' ? 180 : 270}deg" aria-hidden="true"><span class="portal-core"></span><span class="portal-arrow">${arrow}</span></span>`,
    };
};

export function renderBoard({ boardElement, beamLayer, level, boardState, simulation, showTrace = true, onMirrorActivate = null }) {
    const { size, source, target, walls } = level;
    const portals = boardState.portals ?? level.portals ?? [source, target];
    const wallKeys = new Set(walls.map(cellKey));
    const portalByKey = new Map(portals.map((portal) => [cellKey(portal), portal]));
    const mirrorByKey = new Map(boardState.mirrors.map((mirror) => [cellKey(mirror), mirror]));
    const mirrorById = new Map(boardState.mirrors.map((mirror) => [mirror.id, mirror]));
    const beamKeys = showTrace ? new Set((simulation.beamPath || []).map(cellKey)) : new Set();
    const mirrorButtons = new Map();
    let targetElement = null;

    const renderKey = `${level.id}:${size}`;
    const shouldBuildBoard = boardElement.dataset.renderKey !== renderKey;

    boardElement.style.setProperty('--grid-size', size);
    boardElement.setAttribute('aria-rowcount', String(size));
    boardElement.setAttribute('aria-colcount', String(size));

    if (shouldBuildBoard) {
        boardElement.replaceChildren();
        boardElement.dataset.renderKey = renderKey;

        for (let row = 0; row < size; row += 1) {
            const rowElement = createRow(row);
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
                        cell.dataset.defaultAriaLabel = renderedPortal.label;
                        targetElement = cell;
                    }
                }

                if (sameCell(position, source) && !portal) {
                    cell.classList.add('is-source');
                    cell.innerHTML = '<span class="source-glyph" aria-hidden="true"><span></span></span>';
                    cell.setAttribute('aria-label', `Laser emitter${cellLabel(source)}, pointing ${DIRECTION_LABELS[source.direction] ?? source.direction}`);
                }

                const mirror = mirrorByKey.get(key);
                if (mirror) {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'mirror-button';
                    button.dataset.mirrorId = mirror.id;
                    button.innerHTML = '<span class="mirror-glyph"><span></span></span>';
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onMirrorActivate?.(mirror.id, button);
                    });
                    updateMirrorButton(button, mirror);
                    cell.appendChild(button);
                }

                rowElement.appendChild(cell);
            }
            boardElement.appendChild(rowElement);
        }
    } else {
        boardElement.querySelectorAll('.mirror-button').forEach((button) => {
            const mirror = mirrorById.get(button.dataset.mirrorId);
            if (mirror) updateMirrorButton(button, mirror);
        });
        targetElement = boardElement.querySelector('.target-portal-cell');
    }

    boardElement.querySelectorAll('.board-cell').forEach((cell) => {
        cell.classList.toggle('beam-trace', beamKeys.has(`${cell.dataset.row}-${cell.dataset.col}`));
    });
    if (targetElement) {
        targetElement.classList.toggle('target-hit', simulation.targetHit);
        const defaultLabel = targetElement.dataset.defaultAriaLabel;
        if (simulation.targetHit) targetElement.setAttribute('aria-label', 'Orange target portal reached');
        else if (defaultLabel) targetElement.setAttribute('aria-label', defaultLabel);
    }
    boardElement.querySelectorAll('.mirror-button').forEach((button) => mirrorButtons.set(button.dataset.mirrorId, button));

    createBeam(beamLayer, simulation.beamPath, size);
    return { mirrorButtons, targetElement };
}

export function orientationLabel(orientation) {
    return ORIENTATION_LABELS[orientation] ?? 'unknown';
}
