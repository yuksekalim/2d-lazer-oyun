function pointsForPath(path, count) {
    return path
        .slice(0, count)
        .map(({ row, col }) => `${col + 0.5},${row + 0.5}`)
        .join(' ');
}

/** Reveal a beam path one traversed cell at a time. Returns a cancel function. */
export function animateLaser(beamLayer, path = [], { stepDuration = 120, onComplete } = {}) {
    const beamLines = beamLayer?.querySelectorAll('.beam-line, .beam-pulse');
    let timer = null;
    let cancelled = false;

    const finish = () => {
        if (cancelled) return;
        beamLayer?.classList.remove('is-animating');
        onComplete?.();
    };

    const cancel = () => {
        cancelled = true;
        if (timer !== null) clearTimeout(timer);
        beamLayer?.classList.remove('is-animating');
    };

    if (!beamLayer || !beamLines?.length || path.length < 2) {
        timer = setTimeout(finish, 0);
        return cancel;
    }

    let visibleCount = 1;
    const updatePath = () => {
        const points = pointsForPath(path, visibleCount);
        beamLines.forEach((line) => line.setAttribute('points', points));
    };

    beamLayer.classList.add('is-animating');
    updatePath();

    const revealNextCell = () => {
        if (cancelled) return;
        visibleCount += 1;
        updatePath();
        if (visibleCount >= path.length) {
            finish();
            return;
        }
        timer = setTimeout(revealNextCell, stepDuration);
    };

    timer = setTimeout(revealNextCell, stepDuration);
    return cancel;
}
