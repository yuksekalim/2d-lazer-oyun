#!/usr/bin/env python3
"""Validate the version 1 level data and each documented solution path."""

import argparse
import json
from pathlib import Path


DIRECTIONS = {
    "north": (0, -1),
    "east": (1, 0),
    "south": (0, 1),
    "west": (-1, 0),
}

REFLECTIONS = {
    "slash": {
        "north": "east",
        "east": "north",
        "south": "west",
        "west": "south",
    },
    "backslash": {
        "north": "west",
        "west": "north",
        "south": "east",
        "east": "south",
    },
}


def cell_key(cell):
    return cell["x"], cell["y"]


def validate_level(level):
    board = level["board"]
    width, height = board["width"], board["height"]
    assert width > 0 and height > 0, f"{level['id']}: board must be non-empty"
    assert set(board["boundaries"]) == {"north", "east", "south", "west"}
    assert all(value == "blocked" for value in board["boundaries"].values())

    def inside(cell):
        return 0 <= cell["x"] < width and 0 <= cell["y"] < height

    emitter = level["emitter"]
    target = level["target"]["position"]
    assert inside(emitter["position"]), f"{level['id']}: emitter is out of bounds"
    assert inside(target), f"{level['id']}: target is out of bounds"
    assert emitter["direction"] in DIRECTIONS

    occupied = {cell_key(emitter["position"]), cell_key(target)}
    mirrors = {}
    for mirror in level["mirrors"]:
        mirror_id = mirror["id"]
        assert mirror_id not in mirrors, f"{level['id']}: duplicate mirror {mirror_id}"
        assert mirror["orientation"] in REFLECTIONS
        assert mirror["rotatable"] is True
        assert inside(mirror["position"])
        assert cell_key(mirror["position"]) not in occupied
        occupied.add(cell_key(mirror["position"]))
        mirrors[mirror_id] = mirror

    obstacles = {cell_key(cell) for cell in level["obstacles"]}
    assert all(0 <= x < width and 0 <= y < height for x, y in obstacles)
    assert not obstacles & occupied, f"{level['id']}: occupied obstacle cell"

    solution = {
        entry["mirror"]: entry["orientation"] for entry in level["solution"]
    }
    assert len(solution) == len(level["solution"])
    assert set(solution) == set(mirrors)
    assert all(orientation in REFLECTIONS for orientation in solution.values())

    position = cell_key(emitter["position"])
    direction = emitter["direction"]
    seen = set()
    beam_cells = []
    reached_target = False

    for _ in range(width * height * 4 + 1):
        dx, dy = DIRECTIONS[direction]
        position = position[0] + dx, position[1] + dy
        if not (0 <= position[0] < width and 0 <= position[1] < height):
            break

        state = position, direction
        assert state not in seen, f"{level['id']}: solution enters a loop at {state}"
        seen.add(state)
        beam_cells.append(position)

        if position == cell_key(target):
            reached_target = True
            break
        if position in obstacles:
            break

        for mirror_id, mirror in mirrors.items():
            if cell_key(mirror["position"]) == position:
                direction = REFLECTIONS[solution[mirror_id]][direction]
                break

    assert reached_target, (
        f"{level['id']}: documented solution did not reach target; "
        f"last cell was {position}"
    )
    return len(beam_cells)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "path",
        nargs="?",
        type=Path,
        default=Path(__file__).with_name("levels.json"),
        help="level JSON file (default: levels/levels.json)",
    )
    args = parser.parse_args()

    data = json.loads(args.path.read_text(encoding="utf-8"))
    assert data["formatVersion"] == 1, "unsupported level format"
    levels = data["levels"]
    assert 3 <= len(levels) <= 5, "MVP must contain three to five levels"

    for level in levels:
        beam_cells = validate_level(level)
        print(f"{level['id']}: solvable in {beam_cells} beam cells")

    print(f"validated {len(levels)} levels; formatVersion={data['formatVersion']}")


if __name__ == "__main__":
    main()
