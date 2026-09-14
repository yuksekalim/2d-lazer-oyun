import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    DIRECTIONS,
    MIRROR_ORIENTATIONS,
    isInsideBoard,
    laserStateKey,
    reflectDirection,
    step,
} from "../../src/physics/geometry.js";

describe("grid geometry", () => {
    it("moves one cell in every cardinal direction", () => {
        const origin = { x: 3, y: 4 };

        assert.deepEqual(step(origin, DIRECTIONS.NORTH), { x: 3, y: 3 });
        assert.deepEqual(step(origin, DIRECTIONS.EAST), { x: 4, y: 4 });
        assert.deepEqual(step(origin, DIRECTIONS.SOUTH), { x: 3, y: 5 });
        assert.deepEqual(step(origin, DIRECTIONS.WEST), { x: 2, y: 4 });
        assert.deepEqual(origin, { x: 3, y: 4 });
    });

    it("recognizes board boundaries", () => {
        const board = { width: 5, height: 3 };

        assert.equal(isInsideBoard({ x: 0, y: 0 }, board), true);
        assert.equal(isInsideBoard({ x: 4, y: 2 }, board), true);
        assert.equal(isInsideBoard({ x: -1, y: 0 }, board), false);
        assert.equal(isInsideBoard({ x: 5, y: 1 }, board), false);
        assert.equal(isInsideBoard({ x: 2, y: 3 }, board), false);
    });

    it("reflects every direction from a slash mirror", () => {
        assert.equal(reflectDirection(DIRECTIONS.NORTH, MIRROR_ORIENTATIONS.SLASH), DIRECTIONS.EAST);
        assert.equal(reflectDirection(DIRECTIONS.EAST, MIRROR_ORIENTATIONS.SLASH), DIRECTIONS.NORTH);
        assert.equal(reflectDirection(DIRECTIONS.SOUTH, MIRROR_ORIENTATIONS.SLASH), DIRECTIONS.WEST);
        assert.equal(reflectDirection(DIRECTIONS.WEST, MIRROR_ORIENTATIONS.SLASH), DIRECTIONS.SOUTH);
    });

    it("reflects every direction from a backslash mirror", () => {
        assert.equal(reflectDirection(DIRECTIONS.NORTH, MIRROR_ORIENTATIONS.BACKSLASH), DIRECTIONS.WEST);
        assert.equal(reflectDirection(DIRECTIONS.EAST, MIRROR_ORIENTATIONS.BACKSLASH), DIRECTIONS.SOUTH);
        assert.equal(reflectDirection(DIRECTIONS.SOUTH, MIRROR_ORIENTATIONS.BACKSLASH), DIRECTIONS.EAST);
        assert.equal(reflectDirection(DIRECTIONS.WEST, MIRROR_ORIENTATIONS.BACKSLASH), DIRECTIONS.NORTH);
    });

    it("includes direction in a laser state key", () => {
        assert.notEqual(laserStateKey({ x: 2, y: 1 }, DIRECTIONS.NORTH), laserStateKey({ x: 2, y: 1 }, DIRECTIONS.SOUTH));
    });
});
