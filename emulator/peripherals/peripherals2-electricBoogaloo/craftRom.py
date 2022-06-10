from base import Peripheral
from ports import IO_Port
from enum import Enum

class Station(Enum):
    table = 0xFD
    furnace = 0xFE

class Ingredient(Enum):
    air = 0x0
    stick = 0x1
    dirt = 0x2
    stone = 0x3
    cobble = 0x4
    log = 0x5
    leaves = 0x6
    plank = 0x7
    coal = 0x8
    ironOre = 0x9
    sand = 0xA
    glass = 0xB
    sapling = 0xC
    ironIngot = 0xD
    apple = 0xE
    nonstackable = 0xF

class Result(Enum):
    stone = 0x31
    plank = 0x74
    table = 0xFD
    coal = 0x81
    furnace = 0xFE
    ironIngot = 0xD1
    stick = 0x14
    chest = 0xFF
    woodPick = 0xF0
    woodAxe = 0x1F1
    woodShovel = 0xF2
    woodSword = 0xF3
    stonePick = 0xF4
    stoneAxe = 0xF5
    stoneShovel = 0xF6
    stoneSword = 0xF7
    ironPick = 0xF8
    ironAxe = 0xF9
    ironShovel = 0xFA
    ironSword = 0xFB
    shears = 0xFC

RECIPES = {
    #smelting recipes
    ["4"]: Result.stone,
    ["5"]: Result.coal,
    ["9"]: Result.ironIngot,

    #crafting recipes
    ["770770000"]: Result.table,
    ["500000000"]: Result.plank,
    ["444404444"]: Result.furnace,
    ["777707777"]: Result.chest,
    ["700700000"]: Result.stick,

    ["777010010"]: Result.woodPick,
    ["444010010"]: Result.stonePick,
    ["DDD010010"]: Result.ironPick,

    ["770710010"]: Result.woodAxe,
    ["440410010"]: Result.stoneAxe,
    ["DD0D10010"]: Result.ironAxe,

    ["700100100"]: Result.woodShovel,
    ["400100100"]: Result.stoneShovel,
    ["D00100100"]: Result.ironShovel,

    ["700700100"]: Result.woodSword,
    ["400400100"]: Result.stoneSword,
    ["D00D00100"]: Result.ironSword,

    ["0D0D00000"]: Result.shears,
}

class craftRom(Peripheral):
    station = Station.table
    currentRecipe = "000000000" #36 bits > 32 bits, so use a string instead of an int

    def receive(self, data: int, port: IO_Port) -> None:
        if (port == IO_Port.CRAFTROM):
            if (data == Station.table):
                self.station = data
            elif (data == Station.furnace):
                self.station = data
            else:
                self.currentRecipe = self.currentRecipe[1:] + hex(data >> 4) #simulate a shift register
    
    def send(self, port: IO_Port) -> int:
        if (port == IO_Port.CRAFTROM):
            if (self.station == Station.table):
                while (True): #shift the recipe as far left in the crafting grid as it will go
                    if (self.currentRecipe[0] + self.currentRecipe[3] + self.currentRecipe[6] == "000"):
                        self.currentRecipe = self.currentRecipe[1:] + "0"
                    else:
                        break
                while (True): #shift the recipe as far up in the crafting grid as it will go
                    if (self.currentRecipe[0:3] == "000"):
                        self.currentRecipe = self.currentRecipe[3:] + "000"
                    else:
                        break
                return RECIPES[self.currentRecipe.upper()]
            elif (self.station == Station.furnace):
                return RECIPES[self.currentRecipe[8].upper()]