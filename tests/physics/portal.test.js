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
                    { id: "source", role: "source", position: point(0, 0), direction: "E" },
                    { id: "target", role: "target", position: point(2, 0), direction: "E" },
                ],
                target: { position: point(2, 0), direction: "E" },
            },
            { position: point(0, 0), direction: "E" },
        );

        assert.equal(result.terminal.reason, TERMINAL_REASONS.TARGET);
        assert.equal(result.targetHit, true);
        assert.equal(result.portalEvents.at(-1).accepted, true);
    });

    it("rejects a target entry from the wrong direction", () => {
        const result = simulateLaser(
            {
                width: 3,
                height: 1,
                portals: [{ id: "target", role: "target", position: point(2, 0), direction: "W" }],
                target: { position: point(2, 0), direction: "W" },
            },
            { position: point(0, 0), direction: "E" },
        );

        assert.equal(result.terminal.reason, TERMINAL_REASONS.WRONG_TARGET_DIRECTION);
        assert.equal(result.targetHit, false);
        assert.deepEqual(result.terminal.position, point(2, 0));
    });

    it("stops when a beam re-enters its source portal", () => {
        const result = simulateLaser(
            {
                width: 4,
                height: 4,
                portals: [{ id: "source", role: "source", position: point(0, 2), direction: "E" }],
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
    });

});
