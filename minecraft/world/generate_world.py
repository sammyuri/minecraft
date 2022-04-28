from os import path
import tkinter as tk

_SCALE = 32
_TOOLS = [
    "Pencil",
    "Fill",
]
_BLOCKS = [
    "air",
    "grass",
    "dirt",
    "cobble",
    "log",
    "leaf",
    "planks",
    "workbench",
]
_COLOURS = [
    "#FFFFFF",  # air
    "#0BD100",  # grass
    "#8C3600",  # dirt
    "#777777",  # cobble
    "#451701",  # log
    "#067300",  # leaf
    "#FFBB3D",  # planks
    "#BD3F00",  # crafting table
]

class ToolButton(tk.Button):
    def __init__(self, id, root, *args):
        super().__init__(root, text=_TOOLS[id], command=self.clicked, *args)
        self.id = id
        self.root = root
        self.check(0)

    def clicked(self):
        global selectedtool, toolbuttons
        selectedtool = self.id
        for button in toolbuttons:
            button.check(self.id)

    def check(self, id):
        if id == self.id:
            self.configure(bg="#999999", activebackground="#AAAAAA")
        else:
            self.configure(bg="#EEEEEE", activebackground="#FFFFFF")


class BlockButton(tk.Button):
    def __init__(self, id, root, *args):
        super().__init__(root, text=_BLOCKS[id], command=self.clicked, *args)
        self.id = id
        self.root = root
        self.check(0)

    def clicked(self):
        global selectedblock, blockbuttons
        selectedblock = self.id
        for button in blockbuttons:
            button.check(self.id)

    def check(self, id):
        if id == self.id:
            self.configure(bg="#999999", activebackground="#AAAAAA")
        else:
            self.configure(bg="#EEEEEE", activebackground="#FFFFFF")


class Layer(tk.Canvas):
    """A layer of the world"""
    def __init__(self, layerid, blocks, *args) -> None:
        super().__init__(*args)
        self.configure(
            width=_SCALE * 8,
            height=_SCALE * 8,
            bd=0,
        )

        self.root = root
        self.layerid = layerid
        self.blocks = blocks

        self.draw_blocks()
        self.bind("<Button-1>", self.onclick)

    def draw_blocks(self) -> None:
        """Draw the layer"""

        self.delete("all")
        for z in range(8):
            for x in range(8):
                self.create_rectangle(
                    _SCALE * x,
                    _SCALE * z,
                    _SCALE * (x + 1) - 1,
                    _SCALE * (z + 1) - 1,
                    fill=_COLOURS[self.blocks[8 * z + x]],
                    outline=_COLOURS[self.blocks[8 * z + x]],
                )

    def onclick(self, event):
        x = event.x // _SCALE
        z = event.y // _SCALE
        global selectedtool, selectedblock
        if selectedtool == 0:
            if 0 <= x <= 7 and 0 <= z <= 7:
                self.blocks[8 * z + x] = selectedblock
        else:
            self.blocks = [selectedblock] * 64
        self.draw_blocks()




def get_world():
    """Read the world file"""

    worldfile = path.join(
        path.dirname(__file__),
        "world.txt"
    )
    world = []
    with open(worldfile, "r") as f:
        for block in f:
            if block.strip():
                world.append(int(block.strip()))
    world.extend([0] * (512 - len(world)))
    return world


def write_world(world):
    """Write to the world file"""

    worldfile = path.join(
        path.dirname(__file__),
        "world.txt"
    )
    with open(worldfile, "w") as f:
        for block in world:
            f.write(str(block) + "\n")


def convert_to_blocks(world):
    blocks = []
    for i in range(512):
        blocks.append(
            2 * ((world[i // 4] >> (2 * (i % 4))) % 4)
            + ((world[128 + i // 8] >> (i % 8)) % 2)
        )
    return blocks

def convert_to_world(blocks):
    worldlower, worldupper = [], []
    for i in range(0, 512, 4):
        row = blocks[i:i + 4]
        row = list(map(lambda e: e >> 1, row))
        worldlower.append(
            row[0]
            + (row[1] << 2)
            + (row[2] << 4)
            + (row[3] << 6)
        )
    for i in range(0, 512, 8):
        row = blocks[i:i + 8]
        row = list(map(lambda e: e % 2, row))
        worldupper.append(sum(row[i] << i for i in range(8)))
    return worldlower + worldupper + [0] * 64


if __name__ == "__main__":
    root = tk.Tk()
    root.title("Build world")
    root.geometry(f"{_SCALE * 32}x{_SCALE * 18}")
    world = get_world()
    blocks = convert_to_blocks(world)

    canvases = []
    for i in range(2):
        for j in range(0, 8, 2):
            index = 4 * i + (j // 2)
            canvases.append(Layer(
                index,
                blocks[64 * index:64 * (index + 1)],
                root
            ))
            canvases[-1].grid(
                row=i,
                column=j,
                columnspan=2,
                sticky="NESW",
            )
    selectedblock = 0
    blockbuttons = []
    for i in range(8):
        blockbuttons.append(BlockButton(i, root))
        blockbuttons[-1].grid(
            row=2,
            column=i,
            sticky="NESW"
        )
    selectedtool = 0
    toolbuttons = []
    for i in range(2):
        toolbuttons.append(ToolButton(i, root))
        toolbuttons[-1].grid(
            row=3,
            column=2 * i,
            columnspan=2,
            sticky="NESW"
        )
    root.mainloop()
    blocks = []
    for canvas in canvases:
        blocks.extend(canvas.blocks)
    world = convert_to_world(blocks)
    write_world(world)
