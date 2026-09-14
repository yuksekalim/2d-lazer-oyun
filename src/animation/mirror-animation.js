export function animateMirror(mirrorButton) {
    if (!mirrorButton) return;

    const mirrorGlyph = mirrorButton.querySelector('.mirror-glyph');
    if (!mirrorGlyph) return;

    mirrorGlyph.getAnimations().forEach((animation) => animation.cancel());
    const fromAngle = Number(mirrorButton.dataset.fromAngle);
    const toAngle = Number(mirrorButton.dataset.toAngle);
    const delta = ((toAngle - fromAngle + 540) % 360) - 180;
    mirrorGlyph.animate(
        [
            { transform: `rotate(${fromAngle}deg) scale(.86)` },
            { transform: `rotate(${fromAngle + delta / 2}deg) scale(1.12)`, offset: .5 },
            { transform: `rotate(${fromAngle + delta}deg) scale(1)` },
        ],
        { duration: 430, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
}
