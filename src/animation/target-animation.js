export function animateTarget(targetElement, targetHit) {
    if (!targetElement || !targetHit) return;

    targetElement.classList.remove('is-celebrating');
    void targetElement.offsetWidth;
    targetElement.classList.add('is-celebrating');
}
