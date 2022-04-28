from os import path


ORDER = [
    "textures.s",
    "ports.s",
    "memory.s",
    "main.s",
    "gameLoop.s",
    "blockToMesh.s",
]


def get_assembly() -> list[str]:
    assembly = []
    for filename in ORDER:
        with open(path.join(path.dirname(__file__), filename), "r") as f:
            for line in f:
                assembly.append(line.strip())
    return assembly

def get_world() -> list[int]:
    world = []
    with open(
        path.join(
            path.join(
                path.dirname(__file__), "world"),
                "world.txt"
            ),
        "r"
    ) as f:
        for line in f:
            try:
                world.append(int(line.strip()))
            except ValueError:
                print(line)
    return world
