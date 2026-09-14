export function bindMirrorInput(boardElement, onRotate) {
    const handleActivation = (event) => {
        const mirrorButton = event.target.closest('.mirror-button');
        if (!mirrorButton) return;

        event.preventDefault();
        onRotate(mirrorButton.dataset.mirrorId, mirrorButton);
    };

    boardElement.addEventListener('click', handleActivation);
    boardElement.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        handleActivation(event);
    });

    return () => {
        boardElement.removeEventListener('click', handleActivation);
    };
}
