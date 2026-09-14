import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createInitialState, normalizeLevel, simulate } from '../../src/ui/physics-adapter.js';

const levelsUrl = new URL('../../levels/levels.json', import.meta.url);
const content = JSON.parse(readFileSync(levelsUrl, 'utf8'));

describe('authored levels', () => {
    it('contains three levels per campaign difficulty', () => {
        assert.equal(content.formatVersion, 2);
        assert.equal(content.levels.length, 9);
        assert.deepEqual(content.levels.map((level) => level.id), [
            'easy_01', 'easy_02', 'easy_03',
            'medium_01', 'medium_02', 'medium_03',
            'hard_01', 'hard_02', 'hard_03',
        ]);
        assert.deepEqual(
            content.levels.map((level) => [level.board.width, level.board.height]),
            [
                [7, 7], [7, 7], [7, 7],
                [11, 11], [11, 11], [11, 11],
                [15, 15], [15, 15], [15, 15],
            ],
        );
    });

    it('connects each target edge to the following source portal', () => {
        for (let index = 0; index < content.levels.length - 1; index += 1) {
            const current = content.levels[index];
            const following = content.levels[index + 1];
            const target = current.portals.find((portal) => portal.role === 'target');
            const source = following.source;
            const expected = {
                W: { x: following.board.width - 1, y: target.position.y, direction: 'W' },
                E: { x: 0, y: target.position.y, direction: 'E' },
                N: { x: target.position.x, y: following.board.height - 1, direction: 'N' },
                S: { x: target.position.x, y: 0, direction: 'S' },
            }[target.direction];

            assert.deepEqual(source.position, { x: expected.x, y: expected.y });
            assert.equal(source.direction, expected.direction);
        }
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
            assert.equal(result.terminalReason, 'target');
            assert.equal(result.terminal.direction, level.target.facingDirection);
            assert.equal(result.terminal.portalId, level.target.portalId);
        });
    }
});
