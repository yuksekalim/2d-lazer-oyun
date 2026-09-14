export function animateLaser(beamLayer) {
    if (!beamLayer) return;

    beamLayer.classList.remove('is-animating');
    void beamLayer.offsetWidth;
    beamLayer.classList.add('is-animating');
}
