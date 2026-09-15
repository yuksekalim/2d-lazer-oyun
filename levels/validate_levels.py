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
        "min_used_mirrors": 8,
        "min_walls": 8,
        "min_portal_distance": 4,
        "max_portal_near_mirrors": 3,
    },
    "medium": {
        "size": 11,
        "count": 10,
        "min_mirrors": 7,
        "min_used_mirrors": 12,
        "min_walls": 18,
        "min_portal_distance": 7,
        "max_portal_near_mirrors": 3,
    },
    "hard": {
        "size": 15,
        "count": 10,
        "min_mirrors": 11,
        "min_used_mirrors": 18,
        "min_walls": 35,
        "min_portal_distance": 10,
        "max_portal_near_mirrors": 3,
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


def trace_level(level, orientations):
    """Trace one orientation map and return enough detail to audit wrong turns."""

    board = level["board"]
    width, height = board["width"], board["height"]
    source = level["source"]
    target = next(portal for portal in level["portals"] if portal["role"] == "target")
    source_position = key(source["position"])
    target_position = key(target["position"])
    walls = {key(cell) for cell in level["obstacles"]}
    mirror_by_cell = {key(mirror["position"]): mirror["id"] for mirror in level["mirrors"]}
    position = source_position
    direction = source["direction"]
    path = [position]
    visited_mirrors = []
    seen = set()

    for _ in range(width * height * 4 + 1):
        state = position, direction
        if state in seen:
            return {
                "target_hit": False,
                "reason": "loop",
                "path": path,
                "visited_mirrors": visited_mirrors,
            }
        seen.add(state)
        dx, dy = DIRECTIONS[direction]
        position = position[0] + dx, position[1] + dy
        if not (0 <= position[0] < width and 0 <= position[1] < height):
            return {
                "target_hit": False,
                "reason": "boundary",
                "path": path,
                "visited_mirrors": visited_mirrors,
            }
        path.append(position)
        if position == target_position:
            return {
                "target_hit": direction == target["direction"],
                "reason": "target" if direction == target["direction"] else "wrong-target-direction",
                "path": path,
                "visited_mirrors": visited_mirrors,
            }
        if position in walls:
            return {
                "target_hit": False,
                "reason": "wall",
                "path": path,
                "visited_mirrors": visited_mirrors,
            }
        if position == source_position:
            return {
                "target_hit": False,
                "reason": "source-reentry",
                "path": path,
                "visited_mirrors": visited_mirrors,
            }
        mirror_id = mirror_by_cell.get(position)
        if mirror_id is not None:
            visited_mirrors.append(mirror_id)
            direction = REFLECTIONS[orientations[mirror_id]][direction]

    return {
        "target_hit": False,
        "reason": "step-limit",
        "path": path,
        "visited_mirrors": visited_mirrors,
    }


def solution_shape(level, solution_result, solution):
    """Return the ordered turn signature used to detect repeated macro routes."""

    mirror_by_cell = {key(mirror["position"]): mirror["id"] for mirror in level["mirrors"]}
    path = solution_result["path"]
    shape = []
    for index, cell in enumerate(path[1:], start=1):
        mirror_id = mirror_by_cell.get(cell)
        if mirror_id is None:
            continue
        incoming = next(
            direction
            for direction, delta in DIRECTIONS.items()
            if (path[index - 1][0] + delta[0], path[index - 1][1] + delta[1]) == cell
        )
        shape.append((incoming, REFLECTIONS[solution[mirror_id]][incoming]))
    return tuple(shape)


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
    portal_distance = sum(
        abs(source["position"][axis] - target["position"][axis]) for axis in ("x", "y")
    )
    assert portal_distance >= rules["min_portal_distance"], (
        f"{level_id}: source and target portals are too close"
    )

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

    solution_result = trace_level(level, solution)
    assert solution_result["target_hit"], (
        f"{level_id}: documented solution did not reach target ({solution_result['reason']})"
    )
    visited_mirrors = solution_result["visited_mirrors"]
    used_mirrors = set(visited_mirrors)
    decoys = set(mirrors) - used_mirrors
    assert len(used_mirrors) >= 4, f"{level_id}: solution needs more mirror decisions"
    assert decoys, f"{level_id}: expected at least one unused decoy mirror"
    assert len(used_mirrors) >= rules["min_used_mirrors"], (
        f"{level_id}: solution needs more mirror decisions"
    )
    assert len(walls) >= rules["min_walls"], f"{level_id}: needs more fixed wall pressure"

    critical_positions = [key(mirrors[mirror_id]["position"]) for mirror_id in used_mirrors]
    source_cell = key(source["position"])
    target_cell = key(target["position"])
    source_near = sum(
        max(abs(x - source_cell[0]), abs(y - source_cell[1])) <= 2
        for x, y in critical_positions
    )
    target_near = sum(
        max(abs(x - target_cell[0]), abs(y - target_cell[1])) <= 2
        for x, y in critical_positions
    )
    assert source_near <= rules["max_portal_near_mirrors"], (
        f"{level_id}: source portal neighborhood is too dense"
    )
    assert target_near <= rules["max_portal_near_mirrors"], (
        f"{level_id}: target portal neighborhood is too dense"
    )

    initial_correct = sum(
        mirrors[mirror_id]["orientation"] == solution[mirror_id]
        for mirror_id in used_mirrors
    )
    correct_ratio = initial_correct / len(used_mirrors)
    assert 0.20 <= correct_ratio <= 0.40, (
        f"{level_id}: {initial_correct}/{len(used_mirrors)} critical mirrors start correct"
    )

    branch_ids = []
    for mirror_id in used_mirrors:
        alternate = dict(solution)
        alternate[mirror_id] = (
            "slash" if solution[mirror_id] == "backslash" else "backslash"
        )
        branch_result = trace_level(level, alternate)
        mirror_position = key(mirrors[mirror_id]["position"])
        if mirror_position not in branch_result["path"]:
            continue
        origin_index = branch_result["path"].index(mirror_position)
        branch_length = len(branch_result["path"]) - origin_index - 1
        if not branch_result["target_hit"] and branch_length >= 3:
            branch_ids.append(mirror_id)
    assert len(set(branch_ids)) >= 2, (
        f"{level_id}: expected at least two meaningful wrong-turn branches"
    )
    return (
        len(solution_result["path"]) - 1,
        len(used_mirrors),
        len(decoys),
        initial_correct,
        len(branch_ids),
        solution_shape(level, solution_result, solution),
    )


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

    seen_targets = {difficulty: set() for difficulty in CAMPAIGN_RULES}
    seen_shapes = {difficulty: set() for difficulty in CAMPAIGN_RULES}
    direction_signatures = {difficulty: [] for difficulty in CAMPAIGN_RULES}
    for level in levels:
        difficulty = level["id"].split("_", 1)[0]
        target_portal = next(portal for portal in level["portals"] if portal["role"] == "target")
        target_cell = key(target_portal["position"])
        assert target_cell not in seen_targets[difficulty], (
            f"{level['id']}: target portal cell repeats within {difficulty}"
        )
        seen_targets[difficulty].add(target_cell)
        result = validate_level(level)
        beam_cells, used_mirrors, decoys, initial_correct, branches, shape = result
        assert shape not in seen_shapes[difficulty], (
            f"{level['id']}: solution route topology repeats within {difficulty}"
        )
        seen_shapes[difficulty].add(shape)
        direction_signatures[difficulty].append(
            tuple(incoming for incoming, _ in shape)
        )
        print(
            f"{level['id']}: solvable in {beam_cells} beam cells; "
            f"{used_mirrors} used mirrors, {decoys} decoys; "
            f"{initial_correct} initially aligned, {branches} wrong-turn branches"
        )
    for difficulty, signatures in direction_signatures.items():
        for first_index, first in enumerate(signatures):
            for second in signatures[first_index + 1 :]:
                longest = 0
                for first_start in range(len(first)):
                    for second_start in range(len(second)):
                        run = 0
                        while (
                            first_start + run < len(first)
                            and second_start + run < len(second)
                            and first[first_start + run] == second[second_start + run]
                        ):
                            run += 1
                        longest = max(longest, run)
                assert longest < 12, (
                    f"{difficulty}: repeated turn motif is too long ({longest})"
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
