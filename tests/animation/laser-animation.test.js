import assert from 'node:assert/strict';
import { test } from 'node:test';
import { animateLaser } from '../../src/animation/laser-animation.js';

function createBeamLayer() {
    const classes = new Set();
    const lines = Array.from({ length: 4 }, () => ({
        attributes: new Map(),
        setAttribute(name, value) {
            this.attributes.set(name, value);
        },
    }));

    return {
        lines,
        classList: {
            add(name) { classes.add(name); },
            remove(name) { classes.delete(name); },
            contains(name) { return classes.has(name); },
        },
        querySelectorAll() { return lines; },
    };
}

function mockAnimationFrames(t) {
    const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
    const previousCancelAnimationFrame = globalThis.cancelAnimationFrame;
    const callbacks = new Map();
    let nextId = 0;

    globalThis.requestAnimationFrame = (callback) => {
        const id = ++nextId;
        callbacks.set(id, callback);
        return id;
    };
    globalThis.cancelAnimationFrame = (id) => callbacks.delete(id);

    t.after(() => {
        if (previousRequestAnimationFrame === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = previousRequestAnimationFrame;
        if (previousCancelAnimationFrame === undefined) delete globalThis.cancelAnimationFrame;
        else globalThis.cancelAnimationFrame = previousCancelAnimationFrame;
    });

    return {
        run(timestamp) {
            const [id, callback] = callbacks.entries().next().value ?? [];
            assert.ok(callback, 'an animation frame should be pending');
            callbacks.delete(id);
            callback(timestamp);
        },
        get pendingCount() { return callbacks.size; },
    };
}

const route = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
];

test('reveals a moving beam tip between grid cells and clears on cancellation', (t) => {
    const frames = mockAnimationFrames(t);
    const layer = createBeamLayer();
    let completionCount = 0;
    const cancel = animateLaser(layer, route, {
        onComplete: () => { completionCount += 1; },
    });

    for (const line of layer.lines) assert.equal(line.attributes.get('points'), '0.5,0.5');
    assert.equal(layer.classList.contains('is-animating'), true);

    frames.run(1000);
    frames.run(1100);
    const partialPoints = layer.lines[0].attributes.get('points').split(' ');
    const [tipX, tipY] = partialPoints.at(-1).split(',').map(Number);
    assert.ok(tipX > 0.5 && tipX < 1.5, 'the tip should be between grid-cell centers');
    assert.equal(tipY, 0.5, 'the tip should still be moving along the first segment');
    for (const line of layer.lines) assert.equal(line.attributes.get('points'), layer.lines[0].attributes.get('points'));

    cancel();
    assert.equal(layer.classList.contains('is-animating'), false);
    assert.equal(completionCount, 0);
    assert.equal(frames.pendingCount, 0);
    for (const line of layer.lines) assert.equal(line.attributes.get('points'), '');
});

test('completes the beam route and invokes its callback once', (t) => {
    const frames = mockAnimationFrames(t);
    const layer = createBeamLayer();
    let completionCount = 0;
    animateLaser(layer, route, {
        onComplete: () => { completionCount += 1; },
    });

    frames.run(2000);
    frames.run(2500);

    for (const line of layer.lines) assert.equal(line.attributes.get('points'), '0.5,0.5 1.5,0.5 1.5,1.5');
    assert.equal(layer.classList.contains('is-animating'), false);
    assert.equal(completionCount, 1);
    assert.equal(frames.pendingCount, 0);
});
