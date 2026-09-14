const prefersReducedMotion = () => typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function animateMirror(mirrorButton) {
    if (!mirrorButton) return null;

    const mirrorGlyph = mirrorButton.querySelector('.mirror-glyph');
    if (!mirrorGlyph) return null;

    mirrorGlyph.getAnimations().forEach((animation) => animation.cancel());
    const fromAngle = Number(mirrorButton.dataset.fromAngle);
    const toAngle = Number(mirrorButton.dataset.toAngle);
    const delta = ((toAngle - fromAngle + 540) % 360) - 180;
    const finalTransform = `rotate(${toAngle}deg)`;
    if (prefersReducedMotion()) {
        mirrorGlyph.style.transform = finalTransform;
        return null;
    }

    const animation = mirrorGlyph.animate(
        [
            { transform: `rotate(${fromAngle}deg) scale(.86)` },
            { transform: `rotate(${fromAngle + delta / 2}deg) scale(1.12)`, offset: .5 },
            { transform: `rotate(${fromAngle + delta}deg) scale(1)` },
        ],
        { duration: 430, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
    animation.onfinish = () => {
        mirrorGlyph.style.transform = finalTransform;
    };
    return () => animation.cancel();
}
