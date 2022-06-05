from base import Peripheral
from ports import IO_Port

from enum import Enum
import tkinter as tk

class Amogus(Peripheral):
    zero = 0
    #TODO

class Vertex:
    def __init__(self, x = 0, y = 0, z = 0, u = 0, v = 0):
        self.x = x
        self.y = y
        self.z = z
        self.u = u
        self.v = v
    x = 0
    y = 0
    v = 0
    u = 0
    v = 0

class Texture(Enum):
    empty = 0x00 #invert for grass top
    checker = 0x01 #the test texture
    grassSide = 0x02
    dirt = 0x03 #also grass bottom
    stone = 0x04
    cobble = 0x05
    logSide = 0x06
    logTop = 0x07
    leaves = 0x08
    plank = 0x09 #also table bottom
    coalOre = 0x0A
    ironOre = 0x0B
    glass = 0x0C
    saplingLight = 0x0D #the white pixels in the sapling texture
    saplingDark = 0x0E #the black pixels in teh sapling texture
    tableSide = 0x0F
    tableTop = 0x10
    furnaceSide = 0x11
    furnaceTop = 0x12
    furnaceFrontOff = 0x13
    furnaceFrontOn = 0x14
    chestSide = 0x15
    chestTop = 0x16
    chestFront = 0x17

    coalItemLight = 0x17
    coalItemDark = 0x18

    shadow = 0x19

    break0 = 0x1A
    break1 = 0x1B
    break2 = 0x1C
    break3 = 0x1D
    break4 = 0x1E
    break5 = 0x1F