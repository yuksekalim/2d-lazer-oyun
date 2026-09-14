import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DIRECTIONS, MIRROR_ORIENTATIONS } from "../../src/physics/geometry.js";
import { simulateLaser, TERMINAL_REASONS } from "../../src/physics/laser.js";

const source = (x, y, direction) => ({ position: { x, y }, direction });
const point = (x, y) => ({ x, y });

describe("laser simulation", () => {
    it("travels through empty cells until it reaches a board boundary", () => {
        const result = simulateLaser(
            { width: 4, height: 3, target: point(0, 2) },
            source(1, 1, DIRECTIONS.EAST),
        );

        assert.deepEqual(result.path, [point(1, 1), point(2, 1), point(3, 1)]);
        assert.equal(result.terminal.reason, TERMINAL_REASONS.BOUNDARY);
        assert.deepEqual(result.terminal.position, point(4, 1));
        assert.equal(result.targetHit, false);
    });

    it("stops before entering a wall and reports the collision cell", () => {
        const result = simulateLaser(
            {
                width: 5,
                height: 3,
                walls: [point(3, 1)],
                target: point(0, 2),
            },
            source(1, 1, DIRECTIONS.EAST),
        );

        assert.deepEqual(result.path, [point(1, 1), point(2, 1)]);
        assert.equal(result.terminal.reason, TERMINAL_REASONS.WALL);
        assert.deepEqual(result.terminal.position, point(3, 1));
    });

    it("detects a target hit as soon as the target cell is entered", () => {
        const result = simulateLaser(
            { width: 5, height: 3, target: point(3, 1) },
            source(1, 1, DIRECTIONS.EAST),
        );

        assert.deepEqual(result.path, [point(1, 1), point(2, 1), point(3, 1)]);
        assert.equal(result.terminal.reason, TERMINAL_REASONS.TARGET);
        assert.equal(result.targetHit, true);
    });

    it("supports multiple reflections in one trace", () => {
        const result = simulateLaser(
            {
                width: 5,
                height: 5,
                mirrors: [
                    { position: point(2, 1), orientation: MIRROR_ORIENTATIONS.SLASH },
                    { position: point(2, 0), orientation: MIRROR_ORIENTATIONS.BACKSLASH },
                    { position: point(0, 0), orientation: MIRROR_ORIENTATIONS.SLASH },
                ],
                target: point(4, 4),
            },
            source(0, 1, DIRECTIONS.EAST),
        );

        assert.deepEqual(result.reflections, [
            { position: point(2, 1), orientation: "/", from: "E", to: "N" },
            { position: point(2, 0), orientation: "\\", from: "N", to: "W" },
            { position: point(0, 0), orientation: "/", from: "W", to: "S" },
        ]);
        assert.deepEqual(result.path, [
            point(0, 1),
            point(1, 1),
            point(2, 1),
            point(2, 0),
            point(1, 0),
            point(0, 0),
            point(0, 1),
            point(0, 2),
            point(0, 3),
            point(0, 4),
        ]);
        assert.equal(result.terminal.reason, TERMINAL_REASONS.BOUNDARY);
    });

    it("terminates a repeating reflected path instead of hanging", () => {
        const result = simulateLaser(
            {
                width: 5,
                height: 5,
                mirrors: [
                    { position: point(1, 1), orientation: MIRROR_ORIENTATIONS.SLASH },
                    { position: point(1, 3), orientation: MIRROR_ORIENTATIONS.BACKSLASH },
                    { position: point(3, 3), orientation: MIRROR_ORIENTATIONS.SLASH },
                    { position: point(3, 1), orientation: MIRROR_ORIENTATIONS.BACKSLASH },
                ],
                target: point(4, 4),
            },
            source(2, 1, DIRECTIONS.WEST),
        );

        assert.equal(result.terminal.reason, TERMINAL_REASONS.LOOP);
        assert.equal(result.targetHit, false);
        assert.deepEqual(result.terminal.position, point(2, 1));
        assert.equal(result.terminal.direction, DIRECTIONS.WEST);
        assert.ok(result.path.length < 30);
    });

    it("leaves an unreachable target unhit", () => {
        const result = simulateLaser(
            {
                width: 4,
                height: 4,
                walls: [point(2, 1)],
                target: point(3, 1),
            },
            source(0, 1, DIRECTIONS.EAST),
        );

        assert.equal(result.targetHit, false);
        assert.equal(result.terminal.reason, TERMINAL_REASONS.WALL);
    });
});
