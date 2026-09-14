import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createInitialState, normalizeLevel, simulate } from '../../src/ui/physics-adapter.js';

const levelsUrl = new URL('../../levels/levels.json', import.meta.url);
const content = JSON.parse(readFileSync(levelsUrl, 'utf8'));

describe('authored levels', () => {
    it('contains exactly two 7x7 teleport MVP levels', () => {
        assert.equal(content.formatVersion, 2);
        assert.equal(content.levels.length, 2);
        assert.ok(content.levels.every((level) => level.board.width === 7 && level.board.height === 7));
        assert.equal(content.levels[0]?.id, 'easy_01');
        assert.equal(content.levels[1]?.id, 'easy_02');
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
