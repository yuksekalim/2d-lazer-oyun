import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { simulateLaser, TERMINAL_REASONS } from "../../src/physics/laser.js";

const point = (x, y) => ({ x, y });

describe("directional portal simulation", () => {
    it("accepts a target entry from the configured direction", () => {
        const result = simulateLaser(
            {
                width: 3,
                height: 1,
                portals: [
                    { id: "source", role: "source", position: point(0, 0), direction: "E", color: "blue" },
                    { id: "target", role: "target", position: point(2, 0), direction: "E", color: "orange" },
                ],
                target: { position: point(2, 0), direction: "E" },
            },
            { position: point(0, 0), direction: "E" },
        );

        assert.equal(result.terminal.reason, TERMINAL_REASONS.TARGET);
        assert.equal(result.targetHit, true);
        assert.equal(result.portalEvents.at(-1).accepted, true);
        assert.equal(result.portalEvents.at(-1).color, "orange");
        assert.deepEqual(result.portalEvents[0], {
            type: "source-emit",
            portalId: "source",
            color: "blue",
            position: point(0, 0),
            direction: "E",
        });
    });

    it("rejects a target entry from the wrong direction", () => {
        const result = simulateLaser(
            {
                width: 3,
                height: 3,
                portals: [{ id: "target", role: "target", position: point(2, 1), direction: "E", color: "orange" }],
                target: { position: point(2, 1), direction: "E" },
            },
            { position: point(2, 2), direction: "N" },
        );

        assert.equal(result.terminal.reason, TERMINAL_REASONS.WRONG_TARGET_DIRECTION);
        assert.equal(result.targetHit, false);
        assert.deepEqual(result.terminal.position, point(2, 1));
    });

    it("stops when a beam re-enters its source portal", () => {
        const result = simulateLaser(
            {
                width: 4,
                height: 4,
                portals: [{ id: "source", role: "source", position: point(0, 2), direction: "E", color: "blue" }],
                target: { position: point(3, 3), direction: "S" },
                mirrors: [
                    { position: point(2, 2), orientation: "/" },
                    { position: point(2, 0), orientation: "\\" },
                    { position: point(0, 0), orientation: "/" },
                ],
            },
            { position: point(0, 2), direction: "E" },
        );

        assert.equal(result.terminal.reason, TERMINAL_REASONS.SOURCE_REENTRY);
        assert.equal(result.targetHit, false);
        assert.equal(result.portalEvents.at(-1).type, "source-enter");
        assert.equal(result.portalEvents[0].type, "source-emit");
        assert.equal(result.portalEvents.at(-1).color, "blue");
    });

    it("terminates a repeating path with the portal-loop reason", () => {
        const result = simulateLaser(
            {
                width: 5,
                height: 5,
                portals: [{ id: "target", role: "target", position: point(4, 3), direction: "E", color: "orange" }],
                target: { portalId: "target" },
                mirrors: [
                    { position: point(1, 1), orientation: "/" },
                    { position: point(1, 3), orientation: "\\" },
                    { position: point(3, 3), orientation: "/" },
                    { position: point(3, 1), orientation: "\\" },
                ],
            },
            { position: point(2, 1), direction: "W" },
        );

        assert.equal(result.terminal.reason, TERMINAL_REASONS.PORTAL_LOOP);
        assert.equal(result.targetHit, false);
        assert.ok(result.path.length < 30);
    });

    it("rejects a source direction that disagrees with its portal", () => {
        assert.throws(
            () => simulateLaser(
                {
                    width: 3,
                    height: 3,
                    portals: [{ id: "source", role: "source", position: point(0, 1), direction: "E", color: "blue" }],
                    target: point(2, 2),
                },
                { position: point(0, 1), direction: "S", portalId: "source" },
            ),
            /Source direction must match/,
        );
    });

    it("validates the teleport MVP portal limits and colors", () => {
        const portal = (id, role, x, y, direction, color) => ({
            id,
            role,
            position: point(x, y),
            direction,
            color,
        });

        assert.throws(
            () => simulateLaser(
                {
                    width: 3,
                    height: 3,
                    portals: [
                        portal("source", "source", 0, 1, "E", "blue"),
                        portal("target", "target", 2, 1, "E", "orange"),
                        portal("extra", "target", 1, 2, "S", "orange"),
                    ],
                    target: { portalId: "target" },
                },
                { position: point(0, 1), direction: "E", portalId: "source" },
            ),
            /at most two portals/,
        );

        assert.throws(
            () => simulateLaser(
                {
                    width: 3,
                    height: 3,
                    portals: [portal("source", "source", 0, 1, "E", "orange")],
                    target: point(2, 2),
                },
                { position: point(0, 1), direction: "E", portalId: "source" },
            ),
            /source portals must use the blue color/,
        );
    });

    it("reaches the documented Level 1 target portal route", () => {
        const result = simulateLaser(
            {
                width: 7,
                height: 7,
                portals: [{ id: "target-01", role: "target", position: point(1, 6), direction: "S", color: "orange" }],
                target: { portalId: "target-01" },
                mirrors: [
                    { position: point(2, 3), orientation: "/" },
                    { position: point(2, 1), orientation: "\\" },
                    { position: point(1, 1), orientation: "/" },
                ],
            },
            { position: point(0, 3), direction: "E" },
        );

        assert.equal(result.targetHit, true);
        assert.deepEqual(result.reflections.map(({ position, from, to }) => ({ position, from, to })), [
            { position: point(2, 3), from: "E", to: "N" },
            { position: point(2, 1), from: "N", to: "W" },
            { position: point(1, 1), from: "W", to: "S" },
        ]);
    });

    it("reaches the documented Level 2 target portal route", () => {
        const result = simulateLaser(
            {
                width: 7,
                height: 7,
                portals: [
                    { id: "source-02", role: "source", position: point(1, 0), direction: "S", color: "blue" },
                    { id: "target-02", role: "target", position: point(4, 6), direction: "S", color: "orange" },
                ],
                target: { portalId: "target-02" },
                mirrors: [
                    { position: point(1, 2), orientation: "\\" },
                    { position: point(4, 2), orientation: "\\" },
                    { position: point(5, 4), orientation: "/" },
                ],
            },
            { position: point(1, 0), direction: "S", portalId: "source-02" },
        );

        assert.equal(result.targetHit, true);
        assert.deepEqual(result.reflections.map(({ position, from, to }) => ({ position, from, to })), [
            { position: point(1, 2), from: "S", to: "E" },
            { position: point(4, 2), from: "E", to: "S" },
        ]);
    });

});
