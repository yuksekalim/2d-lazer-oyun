function pointForCell({ row, col }) {
    return { x: col + 0.5, y: row + 0.5 };
}

function pointsForDistance(points, distance) {
    if (!points.length) return '';
    const visiblePoints = [points[0]];
    let remainingDistance = distance;

    for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const next = points[index];
        const segmentLength = Math.hypot(next.x - previous.x, next.y - previous.y);

        if (segmentLength === 0) continue;
        if (remainingDistance >= segmentLength) {
            visiblePoints.push(next);
            remainingDistance -= segmentLength;
            continue;
        }

        if (remainingDistance > 0) {
            const progress = remainingDistance / segmentLength;
            visiblePoints.push({
                x: previous.x + (next.x - previous.x) * progress,
                y: previous.y + (next.y - previous.y) * progress,
            });
        }
        break;
    }

    return visiblePoints.map(({ x, y }) => `${x},${y}`).join(' ');
}

const prefersReducedMotion = () => typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const MAX_REVEAL_DURATION = 4200;
const MIN_REVEAL_DURATION = 500;
const DURATION_PER_CELL = 96;

/** Advance the beam tip smoothly along its route rather than revealing the full route at once. */
export function animateLaser(beamLayer, path = [], { onComplete } = {}) {
    const beamLines = beamLayer?.querySelectorAll('.beam-glow, .beam-line, .beam-pulse, .beam-spark');
    let timer = null;
    let frame = null;
    let cancelled = false;
    let completed = false;

    const route = path.map(pointForCell);
    const routeLength = route.slice(1).reduce((length, point, index) => (
        length + Math.hypot(point.x - route[index].x, point.y - route[index].y)
    ), 0);
    const completeRoute = pointsForDistance(route, routeLength);

    const drawRoute = (points) => {
        beamLines?.forEach((line) => line.setAttribute('points', points));
    };

    const finish = () => {
        if (cancelled || completed) return;
        completed = true;
        if (timer !== null) clearTimeout(timer);
        if (frame !== null) cancelAnimationFrame(frame);
        drawRoute(completeRoute);
        beamLayer?.classList.remove('is-animating');
        onComplete?.();
    };

    const cancel = () => {
        if (cancelled || completed) return;
        cancelled = true;
        if (timer !== null) clearTimeout(timer);
        if (frame !== null) cancelAnimationFrame(frame);
        drawRoute('');
        beamLayer?.classList.remove('is-animating');
    };

    if (!beamLayer || !beamLines?.length || route.length < 2 || routeLength === 0) {
        timer = setTimeout(finish, 0);
        return cancel;
    }

    if (prefersReducedMotion()) {
        drawRoute(completeRoute);
        timer = setTimeout(finish, 0);
        return cancel;
    }

    const duration = Math.min(
        MAX_REVEAL_DURATION,
        Math.max(MIN_REVEAL_DURATION, routeLength * DURATION_PER_CELL),
    );
    drawRoute(pointsForDistance(route, 0));
    beamLayer.classList.add('is-animating');

    let startTime = null;
    const animateFrame = (timestamp) => {
        if (cancelled || completed) return;
        if (startTime === null) startTime = timestamp;

        const progress = Math.min(1, (timestamp - startTime) / duration);
        drawRoute(pointsForDistance(route, routeLength * progress));
        if (progress >= 1) {
            finish();
            return;
        }
        frame = requestAnimationFrame(animateFrame);
    };

    frame = requestAnimationFrame(animateFrame);
    // Complete cleanly if the browser throttles animation frames in a background tab.
    timer = setTimeout(finish, duration + 250);
    return cancel;
}
