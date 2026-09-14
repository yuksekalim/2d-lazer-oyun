import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createInitialState, normalizeLevel, simulate } from '../../src/ui/physics-adapter.js';

const levelsUrl = new URL('../../levels/levels.json', import.meta.url);
const content = JSON.parse(readFileSync(levelsUrl, 'utf8'));

describe('authored levels', () => {
    it('includes a 5x5 MVP level first', () => {
        assert.equal(content.levels[0]?.board.width, 5);
        assert.equal(content.levels[0]?.board.height, 5);
    });

    for (const rawLevel of content.levels) {
        it(`${rawLevel.id} has a verified solution`, () => {
            const level = normalizeLevel(rawLevel);
            const solution = new Map(level.solution.map((item) => [item.mirror, item.orientation]));
            const state = createInitialState(level);
            state.mirrors = state.mirrors.map((mirror) => ({
                ...mirror,
                orientation: solution.get(mirror.id) ?? mirror.orientation,
            }));

            const result = simulate(state);
            assert.equal(result.targetHit, true, `${rawLevel.id} did not reach its target`);
        });
    }
});
