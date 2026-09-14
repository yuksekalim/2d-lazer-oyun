export function animateMirror(mirrorButton) {
    if (!mirrorButton) return;

    mirrorButton.classList.remove('is-rotating');
    void mirrorButton.offsetWidth;
    mirrorButton.classList.add('is-rotating');
}
