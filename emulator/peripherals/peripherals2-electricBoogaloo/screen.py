from base import Peripheral
from emulator.peripherals.minecraftdisplay import SCREEN_WIDTH
from ports import IO_Port

import tkinter as tk

SCREEN_WIDTH = 96
SCREEN_HEIGHT = 64
SCALE = 8
COLOUR = "yellow"

class Screen(Peripheral):
    def __init__(self, port, portrange):
        super().__init__(port, portrange)

        self.root = tk.Tk("Minecraft in Minecraft")
        self.root.geometry(
            str(SCREEN_WIDTH * SCALE)
            + "x"
            + str(SCREEN_HEIGHT * SCALE)
        )

        self.screen = tk.Canvas(
            self.root,
            width = SCREEN_WIDTH * SCALE,
            height = SCREEN_HEIGHT * SCALE
        )
        self.screen.configure(
            bg="#000000",
        )
        self.screen.pack()