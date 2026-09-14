#!/usr/bin/env python3
"""Validate the two format-version-2 teleport MVP levels."""

import argparse
import json
from pathlib import Path


DIRECTIONS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}
REFLECTIONS = {
    "slash": {"N": "E", "E": "N", "S": "W", "W": "S"},
    "backslash": {"N": "W", "W": "N", "S": "E", "E": "S"},
}


def key(cell):
    return cell["x"], cell["y"]


def inside(cell, width, height):
    return 0 <= cell["x"] < width and 0 <= cell["y"] < height


def expected_portal_direction(position, width, height, role):
    x, y = position["x"], position["y"]
    if x == 0:
        return "E" if role == "source" else "W"
    if x == width - 1:
        return "W" if role == "source" else "E"
    if y == 0:
        return "S" if role == "source" else "N"
    if y == height - 1:
        return "N" if role == "source" else "S"
    return None


def validate_level(level):
    board = level["board"]
    width, height = board["width"], board["height"]
    assert (width, height) == (7, 7), f"{level['id']}: MVP board must be 7x7"
    assert set(board["boundaries"]) == {"north", "east", "south", "west"}
    assert all(value == "blocked" for value in board["boundaries"].values())

    source = level["source"]
    assert source["direction"] in DIRECTIONS
    assert inside(source["position"], width, height)

    portals = level["portals"]
    assert 1 <= len(portals) <= 2, f"{level['id']}: expected one or two portals"
    portal_by_id = {}
    portal_by_cell = {}
    for portal in portals:
        assert portal["id"] not in portal_by_id, f"{level['id']}: duplicate portal id"
        assert portal["role"] in {"source", "target"}
        assert portal["direction"] in DIRECTIONS
        assert inside(portal["position"], width, height)
        expected = expected_portal_direction(portal["position"], width, height, portal["role"])
        assert expected == portal["direction"], f"{level['id']}: invalid {portal['role']} portal facing"
        portal_by_id[portal["id"]] = portal
        assert key(portal["position"]) not in portal_by_cell, f"{level['id']}: duplicate portal cell"
        portal_by_cell[key(portal["position"])] = portal

    target = portal_by_id[level["target"]["portalId"]]
    assert target["role"] == "target"
    source_portal = None
    if source["role"] == "portal":
        source_portal = portal_by_id[source["portalId"]]
        assert source_portal["role"] == "source"
        assert key(source["position"]) == key(source_portal["position"])
        assert source["direction"] == source_portal["direction"]
    else:
        assert source["role"] == "emitter"
    assert key(source["position"]) != key(target["position"])

    occupied = {key(source["position"]), key(target["position"])}
    mirrors = {}
    assert len(level["mirrors"]) == 3
    for mirror in level["mirrors"]:
        assert mirror["id"] not in mirrors, f"{level['id']}: duplicate mirror id"
        assert mirror["orientation"] in REFLECTIONS
        assert mirror["rotatable"] is True
        assert inside(mirror["position"], width, height)
        assert key(mirror["position"]) not in occupied, f"{level['id']}: overlapping mirror"
        occupied.add(key(mirror["position"]))
        mirrors[mirror["id"]] = mirror

    walls = {key(cell) for cell in level["obstacles"]}
    assert all(0 <= x < width and 0 <= y < height for x, y in walls)
    assert not walls & occupied, f"{level['id']}: wall overlaps an occupied cell"

    solution = {entry["mirror"]: entry["orientation"] for entry in level["solution"]}
    assert len(solution) == len(level["solution"])
    assert set(solution) == set(mirrors)
    assert all(orientation in REFLECTIONS for orientation in solution.values())

    position = key(source["position"])
    direction = source["direction"]
    seen = set()
    beam_cells = []
    reached_target = False
    for _ in range(width * height * 4 + 1):
        state = position, direction
        assert state not in seen, f"{level['id']}: solution loops at {state}"
        seen.add(state)
        dx, dy = DIRECTIONS[direction]
        position = position[0] + dx, position[1] + dy
        if not (0 <= position[0] < width and 0 <= position[1] < height):
            break
        beam_cells.append(position)
        if position == key(target["position"]):
            assert direction == target["direction"], f"{level['id']}: solution enters target incorrectly"
            reached_target = True
            break
        if position in walls:
            break
        if source_portal and position == key(source_portal["position"]):
            break
        for mirror_id, mirror in mirrors.items():
            if key(mirror["position"]) == position:
                direction = REFLECTIONS[solution[mirror_id]][direction]
                break

    assert reached_target, f"{level['id']}: documented solution did not reach target"
    return len(beam_cells)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, default=Path(__file__).with_name("levels.json"))
    args = parser.parse_args()
    data = json.loads(args.path.read_text(encoding="utf-8"))
    assert data["formatVersion"] == 2, "unsupported level format"
    assert len(data["levels"]) == 2, "teleport MVP must contain two levels"
    for level in data["levels"]:
        print(f"{level['id']}: solvable in {validate_level(level)} beam cells")
    print(f"validated {len(data['levels'])} levels; formatVersion={data['formatVersion']}")


if __name__ == "__main__":
    main()
