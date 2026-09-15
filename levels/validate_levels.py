#!/usr/bin/env python3
"""Validate the format-version-2 campaign and each intended solution route."""

import argparse
import json
from pathlib import Path


DIRECTIONS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}
REFLECTIONS = {
    "slash": {"N": "E", "E": "N", "S": "W", "W": "S"},
    "backslash": {"N": "W", "W": "N", "S": "E", "E": "S"},
}
CAMPAIGN_RULES = {
    "easy": {
        "size": 7,
        "count": 10,
        "min_mirrors": 5,
        "new_min_used_mirrors": 8,
        "new_min_walls": 8,
    },
    "medium": {
        "size": 11,
        "count": 10,
        "min_mirrors": 7,
        "new_min_used_mirrors": 8,
        "new_min_walls": 18,
    },
    "hard": {
        "size": 15,
        "count": 10,
        "min_mirrors": 11,
        "new_min_used_mirrors": 18,
        "new_min_walls": 35,
    },
}


def key(cell):
    return cell["x"], cell["y"]


def inside(cell, width, height):
    return 0 <= cell["x"] < width and 0 <= cell["y"] < height


def expected_portal_direction(position, width, height, role):
    x, y = key(position)
    if x == 0:
        return "E" if role == "source" else "W"
    if x == width - 1:
        return "W" if role == "source" else "E"
    if y == 0:
        return "S" if role == "source" else "N"
    if y == height - 1:
        return "N" if role == "source" else "S"
    return None


def expected_next_source(target, next_board):
    """Map a completed target edge to the next level's source portal."""
    x, y = key(target["position"])
    if target["direction"] == "W":
        return {"x": next_board["width"] - 1, "y": y, "direction": "W"}
    if target["direction"] == "E":
        return {"x": 0, "y": y, "direction": "E"}
    if target["direction"] == "N":
        return {"x": x, "y": next_board["height"] - 1, "direction": "N"}
    if target["direction"] == "S":
        return {"x": x, "y": 0, "direction": "S"}
    raise AssertionError("target direction must identify a board edge")


def validate_level(level):
    level_id = level["id"]
    difficulty = level_id.split("_", 1)[0]
    rules = CAMPAIGN_RULES[difficulty]
    board = level["board"]
    width, height = board["width"], board["height"]
    assert (width, height) == (rules["size"], rules["size"]), (
        f"{level_id}: {difficulty} board must be {rules['size']}x{rules['size']}"
    )
    assert set(board["boundaries"]) == {"north", "east", "south", "west"}
    assert all(value == "blocked" for value in board["boundaries"].values())

    source = level["source"]
    assert source["role"] == "portal"
    assert source["direction"] in DIRECTIONS
    assert inside(source["position"], width, height)

    portals = level["portals"]
    assert len(portals) == 2, f"{level_id}: expected one source and one target portal"
    portal_by_id = {}
    portal_by_cell = {}
    for portal in portals:
        assert portal["id"] not in portal_by_id, f"{level_id}: duplicate portal id"
        assert portal["role"] in {"source", "target"}
        assert portal["direction"] in DIRECTIONS
        assert inside(portal["position"], width, height)
        assert expected_portal_direction(
            portal["position"], width, height, portal["role"]
        ) == portal["direction"], f"{level_id}: invalid portal facing"
        assert key(portal["position"]) not in portal_by_cell
        portal_by_id[portal["id"]] = portal
        portal_by_cell[key(portal["position"])] = portal

    source_portals = [portal for portal in portals if portal["role"] == "source"]
    target_portals = [portal for portal in portals if portal["role"] == "target"]
    assert len(source_portals) == len(target_portals) == 1
    source_portal = source_portals[0]
    target_portal = target_portals[0]
    assert source["portalId"] == source_portal["id"]
    assert key(source["position"]) == key(source_portal["position"])
    assert source["direction"] == source_portal["direction"]
    assert source_portal["color"] == "blue"
    assert target_portal["color"] == "orange"

    target = portal_by_id[level["target"]["portalId"]]
    assert target is target_portal
    assert key(source["position"]) != key(target["position"])

    occupied = {key(source["position"]), key(target["position"])}
    mirrors = {}
    mirror_by_cell = {}
    assert len(level["mirrors"]) >= rules["min_mirrors"]
    for mirror in level["mirrors"]:
        mirror_id = mirror["id"]
        mirror_cell = key(mirror["position"])
        assert mirror_id not in mirrors, f"{level_id}: duplicate mirror id"
        assert mirror["orientation"] in REFLECTIONS
        assert mirror["rotatable"] is True
        assert inside(mirror["position"], width, height)
        assert mirror_cell not in occupied, f"{level_id}: overlapping mirror"
        occupied.add(mirror_cell)
        mirrors[mirror_id] = mirror
        mirror_by_cell[mirror_cell] = mirror_id

    walls = {key(cell) for cell in level["obstacles"]}
    assert len(walls) == len(level["obstacles"]), f"{level_id}: duplicate wall"
    assert all(0 <= x < width and 0 <= y < height for x, y in walls)
    assert not walls & occupied, f"{level_id}: wall overlaps an occupied cell"

    solution = {
        entry["mirror"]: entry["orientation"] for entry in level["solution"]
    }
    assert len(solution) == len(level["solution"])
    assert set(solution) == set(mirrors), f"{level_id}: incomplete solution metadata"
    assert all(orientation in REFLECTIONS for orientation in solution.values())

    position = key(source["position"])
    direction = source["direction"]
    seen = set()
    visited_mirrors = []
    beam_cells = []
    reached_target = False
    for _ in range(width * height * 4 + 1):
        state = position, direction
        assert state not in seen, f"{level_id}: solution loops at {state}"
        seen.add(state)
        dx, dy = DIRECTIONS[direction]
        position = position[0] + dx, position[1] + dy
        if not (0 <= position[0] < width and 0 <= position[1] < height):
            break
        beam_cells.append(position)

        if position == key(target["position"]):
            assert direction == target["direction"], (
                f"{level_id}: solution enters target from the wrong direction"
            )
            reached_target = True
            break
        if position in walls or position == key(source_portal["position"]):
            break
        mirror_id = mirror_by_cell.get(position)
        if mirror_id is not None:
            visited_mirrors.append(mirror_id)
            direction = REFLECTIONS[solution[mirror_id]][direction]

    assert reached_target, f"{level_id}: documented solution did not reach target"
    used_mirrors = set(visited_mirrors)
    decoys = set(mirrors) - used_mirrors
    assert len(used_mirrors) >= 4, f"{level_id}: solution needs more mirror decisions"
    assert decoys, f"{level_id}: expected at least one unused decoy mirror"
    assert all(
        mirrors[mirror_id]["orientation"] != solution[mirror_id]
        for mirror_id in used_mirrors
    ), f"{level_id}: used mirror starts in its solution orientation"
    if int(level_id.rsplit("_", 1)[1]) >= 4:
        assert len(used_mirrors) >= rules["new_min_used_mirrors"], (
            f"{level_id}: new level needs more solution-critical mirrors"
        )
        assert len(walls) >= rules["new_min_walls"], (
            f"{level_id}: new level needs more fixed wall pressure"
        )
    return len(beam_cells), len(used_mirrors), len(decoys)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "path",
        nargs="?",
        type=Path,
        default=Path(__file__).with_name("levels.json"),
    )
    args = parser.parse_args()
    data = json.loads(args.path.read_text(encoding="utf-8"))
    assert data["formatVersion"] == 2, "unsupported level format"
    levels = data["levels"]
    assert len(levels) == 30, "campaign must contain thirty levels"

    ids = [level["id"] for level in levels]
    expected_ids = {
        f"{difficulty}_{index:02d}"
        for difficulty in CAMPAIGN_RULES
        for index in range(1, 11)
    }
    assert set(ids) == expected_ids, "campaign ids must contain ten levels per difficulty"
    for difficulty, rules in CAMPAIGN_RULES.items():
        assert sum(level["id"].startswith(f"{difficulty}_") for level in levels) == rules["count"]

    for level in levels:
        beam_cells, used_mirrors, decoys = validate_level(level)
        print(
            f"{level['id']}: solvable in {beam_cells} beam cells; "
            f"{used_mirrors} used mirrors, {decoys} decoys"
        )
    for current, following in zip(levels, levels[1:]):
        target_portal = next(portal for portal in current["portals"] if portal["role"] == "target")
        expected = expected_next_source(target_portal, following["board"])
        actual = following["source"]
        assert key(actual["position"]) == (expected["x"], expected["y"]), (
            f"{current['id']} -> {following['id']}: source position breaks portal continuity"
        )
        assert actual["direction"] == expected["direction"], (
            f"{current['id']} -> {following['id']}: source direction breaks portal continuity"
        )
        print(f"{current['id']} -> {following['id']}: portal handoff aligned")
    print(f"validated {len(levels)} levels; formatVersion={data['formatVersion']}")


if __name__ == "__main__":
    main()
