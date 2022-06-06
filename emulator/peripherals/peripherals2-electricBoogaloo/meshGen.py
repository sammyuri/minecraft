from ast import Constant
from enum import Enum

from base import Peripheral
from ports import IO_Port
from blockRam import BlockRam
from amogus import Amogus, Vertex, Texture

def isTransparent(blockId):
    TRANSPARENTBLOCKS = [Block.air, Block.leaves, Block.sapling, Block.glass, Block.chest]
    if (blockId in TRANSPARENTBLOCKS):
        return True
    return False

def isFull(blockId):
    NONFULLBLOCKS = [Block.air, Block.sapling, Block.chest]
    if (blockId in NONFULLBLOCKS):
        return False
    return True

def isBlockItem(itemId):
    NONBLOCKITEMS = [Item.coal, Item.sapling]
    if (itemId in NONBLOCKITEMS):
        return False
    return True

class Block(Enum):
    air = 0x0
    grass = 0x1
    dirt = 0x2
    stone = 0x3
    cobble = 0x4
    log = 0x5
    leaves = 0x6
    plank = 0x7
    coalOre = 0x8
    ironOre = 0x9
    sand = 0xA
    glass = 0xB
    sapling = 0xC
    table = 0xD
    furnace = 0xE
    chest = 0xF

class Item(Enum):
    dirt = 0x2
    cobble = 0x4
    log = 0x5
    leaves = 0x6
    plank = 0x7
    coal = 0x8
    ironOre = 0x9
    sand = 0xA
    sapling = 0xC
    table = 0xD
    furnace = 0xE
    chest = 0xF

class Quad(Enum):
    fullBlockNegX = 0x00
    fullBlockPosX = 0x01
    fullBlockNegZ = 0x02
    fullBlockPosZ = 0x03
    fullBlockNegY = 0x04
    fullBlockPosY = 0x05

    crossBlock1 = 0x06
    crossBlock2 = 0x07

    smallBlockNegX = 0x08
    smallBlockPosX = 0x09
    smallBlockNegZ = 0x0A
    smallBlockPosZ = 0x0B
    smallBlockNegY = 0x0C
    smallBlockPosY = 0x0D

    itemShadow = 0x0E

    blockItemNegX = 0x0F
    blockItemPosX = 0x10
    blockItemNegZ = 0x11
    blockItemPosZ = 0x12
    blockItemNegY = 0x13
    blockItemPosY = 0x14

    crossItem1 = 0x15
    crossItem2 = 0x16
    crossItem3 = 0x17
    crossItem4 = 0x18

    bedrock = 0x19

Quads = {
    [Quad.fullBlockNegX]: [
        [0, 0, 16],
        [0, 16, 16],
        [0, 16, 0],
        [0, 0, 0]
    ],
    [Quad.fullBlockPosX]: [
        [16, 0, 0],
        [16, 16, 0],
        [16, 16, 16],
        [16, 0, 16]
    ],
    [Quad.fullBlockNegZ]: [
        [0, 0, 0],
        [0, 16, 0],
        [16, 16, 0],
        [16, 0, 0]
    ],
    [Quad.fullBlockPosZ]: [
        [16, 0, 16],
        [16, 16, 16],
        [0, 16, 16],
        [0, 0, 16]
    ],
    [Quad.fullBlockNegY]: [
        [0, 0, 16],
        [0, 0, 0],
        [16, 0, 0],
        [16, 0, 16]
    ],
    [Quad.fullBlockPosY]: [
        [0, 16, 0],
        [0, 16, 16],
        [16, 16, 16],
        [16, 16, 0]
    ],

    [Quad.crossBlock1]: [
        [2, 0, 2],
        [2, 16, 2],
        [14, 16, 14],
        [14, 0, 14]
    ],
    [Quad.crossBlock2]: [
        [2, 0, 14],
        [2, 16, 14],
        [14, 16, 2],
        [14, 0, 2]
    ],

    [Quad.smallBlockNegX]: [
        [1, 0, 15],
        [1, 14, 15],
        [1, 14, 1],
        [1, 0, 1]
    ],
    [Quad.smallBlockPosX]: [
        [15, 0, 1],
        [15, 14, 1],
        [15, 14, 15],
        [15, 0, 15]
    ],
    [Quad.smallBlockNegZ]: [
        [1, 0, 1],
        [1, 14, 1],
        [15, 14, 1],
        [15, 0, 1]
    ],
    [Quad.smallBlockPosZ]: [
        [15, 0, 15],
        [15, 14, 15],
        [1, 14, 15],
        [1, 0, 15]
    ],
    [Quad.smallBlockNegY]: [
        [1, 0, 15],
        [1, 0, 1],
        [15, 0, 1],
        [15, 0, 15]
    ],
    [Quad.smallBlockPosY]: [
        [1, 14, 1],
        [1, 14, 15],
        [15, 14, 15],
        [15, 14, 1]
    ],

    [Quad.itemShadow]: [
        [0, 0, 0],
        [0, 0, 8],
        [8, 0, 8],
        [8, 0, 0]
    ],

    [Quad.blockItemNegX]: [
        [1, 1, 7],
        [1, 7, 7],
        [1, 7, 1],
        [1, 1, 1]
    ],
    [Quad.blockItemPosX]: [
        [7, 1, 1],
        [7, 7, 1],
        [7, 7, 7],
        [7, 1, 7]
    ],
    [Quad.blockItemNegZ]: [
        [1, 1, 1],
        [1, 7, 1],
        [7, 7, 1],
        [7, 1, 1]
    ],
    [Quad.blockItemPosZ]: [
        [7, 1, 7],
        [7, 7, 7],
        [1, 7, 7],
        [1, 1, 7]
    ],
    [Quad.blockItemNegY]: [
        [1, 1, 7],
        [1, 1, 1],
        [7, 1, 1],
        [7, 1, 7]
    ],
    [Quad.blockItemPosY]: [
        [1, 7, 1],
        [1, 7, 7],
        [7, 7, 7],
        [7, 7, 1]
    ],

    [Quad.crossItem1]: [
        [2, 1, 2],
        [2, 6, 2],
        [6, 6, 6],
        [6, 1, 6]
    ],
    [Quad.crossItem2]: [
        [2, 1, 6],
        [2, 6, 6],
        [6, 6, 2],
        [6, 1, 2]
    ],
    [Quad.crossItem3]: [
        [6, 1, 2],
        [6, 6, 2],
        [2, 6, 6],
        [2, 1, 6]
    ],
    [Quad.crossItem4]: [
        [6, 1, 6],
        [6, 6, 6],
        [2, 6, 2],
        [2, 1, 2]
    ],

    [Quad.bedrock]: [
        [0, 0, 0],
        [0, 0, 16],
        [16, 0, 16],
        [16, 0, 0]
    ]
}

MeshROM = {
    [Block.air]: {
        ["block"]: {
            ["textures"]: [],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [],
            ["quads"]: []
        }
    },
    [Block.grass]: {
        ["block"]: { #grass block
            ["textures"]: [
                { #top
                    ["id"]: Texture.empty,
                    ["settings"]: 0b1010 #BtIo
                },
                { #bottom
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.grassSide,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        },
        ["item"]: {} #no item
    },
    [Block.dirt]: {
        ["block"]: { #dirt block
            ["textures"]: [
                { #top
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
                { #include front face because this block shares data with its item
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
            ],
            ["quads"]: []
        },
        ["item"]: { #data is duplicate of dirt block
            ["textures"]: [
                { #top
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.dirt,
                    ["settings"]: 0b1000 #Btio
                },
            ],
            ["quads"]: []
        }
    },
    [Block.stone]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        },
        ["item"]: {}
    },
    [Block.cobble]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #include front face because this block shares data with its item
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.cobble,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: [] 
        }
    },
    [Block.log]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.logTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.logTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.logSide,
                    ["settings"]: 0b1000 #Btio
                },
                { #include front face because this block shares data with its item
                    ["id"]: Texture.logSide,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.logTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.logTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.logSide,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.logSide,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        }
    },
    [Block.leaves]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                },
                { #bottom
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                },
                { #sides
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                },
                { #include front face because this block shares data with its item
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                }
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                },
                { #bottom
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                },
                { #sides
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                },
                { #front
                    ["id"]: Texture.leaves,
                    ["settings"]: 0b1100 #BTio
                }
            ],
            ["quads"]: []
        }
    },
    [Block.plank]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #include front face because this block shares data with its item
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
            ],
            ["quads"]: []
        }
    },
    [Block.coalOre]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.coalOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.coalOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.coalOre,
                    ["settings"]: 0b1000 #Btio
                },
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #light pixles
                    ["id"]: Texture.coalItemLight,
                    ["settings"]: 0b1100 #BTio
                },
                { #dark pixels
                    ["id"]: Texture.coalItemDark,
                    ["settings"]: 0b1110 #BTIo
                }
            ],
            ["quads"]: [
                { ["id"]: Quad.crossItem1, ["texIndex"]: 0 },
                { ["id"]: Quad.crossItem1, ["texIndex"]: 1 },
                { ["id"]: Quad.crossItem2, ["texIndex"]: 0 },
                { ["id"]: Quad.crossItem2, ["texIndex"]: 1 },
                { ["id"]: Quad.crossItem3, ["texIndex"]: 0 },
                { ["id"]: Quad.crossItem3, ["texIndex"]: 1 },
                { ["id"]: Quad.crossItem4, ["texIndex"]: 0 },
                { ["id"]: Quad.crossItem4, ["texIndex"]: 1 },
            ]
        }
    },
    [Block.ironOre]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #include front face because this block shares data with its item
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        },
        ["item"]: { #identical data to block
            ["textures"]: [
                { #top
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.ironOre,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        }
    },
    [Block.sand]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                },
                { #bottom
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                },
                { #sides
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                },
                { #include front face because this block shares data with its item
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                }
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                },
                { #bottom
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                },
                { #sides
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                },
                { #front
                    ["id"]: Texture.dirt, #inverted looks like sand
                    ["settings"]: 0b1010 #BtIo
                }
            ],
            ["quads"]: []
        }
    },
    [Block.glass]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.glass,
                    ["settings"]: 0b1100 #BTio
                },
                { #bottom
                    ["id"]: Texture.glass,
                    ["settings"]: 0b1100 #BTio
                },
                { #sides
                    ["id"]: Texture.glass,
                    ["settings"]: 0b1100 #BTio
                },
            ],
            ["quads"]: []
        },
        ["item"]: {}
    },
    [Block.sapling]: {
        ["block"]: {
            ["textures"]: [
                { #light pixles
                    ["id"]: Texture.saplingLight,
                    ["settings"]: 0b0100 #bTio
                },
                { #dark pixels
                    ["id"]: Texture.saplingDark,
                    ["settings"]: 0b0110 #bTIo
                }
            ],
            ["quads"]: [
                { ["id"]: Quad.crossBlock1, ["texIndex"]: 0 },
                { ["id"]: Quad.crossBlock1, ["texIndex"]: 1 },
                { ["id"]: Quad.crossBlock2, ["texIndex"]: 0 },
                { ["id"]: Quad.crossBlock2, ["texIndex"]: 1 },
                { ["id"]: 0x1F, ["texIndex"]: 0 }
            ]
        },
        ["item"]: {
            ["textures"]: [
                { #light pixles
                    ["id"]: Texture.saplingLight,
                    ["settings"]: 0b0100 #bTio
                },
                { #dark pixels
                    ["id"]: Texture.saplingDark,
                    ["settings"]: 0b0110 #bTIo
                }
            ],
            ["quads"]: [
                { ["id"]: Quad.crossItem1, ["texIndex"]: 0 },
                { ["id"]: Quad.crossItem1, ["texIndex"]: 1 },
                { ["id"]: Quad.crossItem2, ["texIndex"]: 0 },
                { ["id"]: Quad.crossItem2, ["texIndex"]: 1 },
                { ["id"]: 0x1F, ["texIndex"]: 0 }
            ]
        }
    },
    [Block.table]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.tableTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.tableSide,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.tableSide,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.tableTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.plank,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.tableSide,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.tableSide,
                    ["settings"]: 0b1000 #Btio
                }
            ],
            ["quads"]: []
        }
    },
    [Block.furnace]: {
        ["block"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.furnaceTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.furnaceTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.furnaceSide,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.furnaceFrontOff,
                    ["settings"]: 0b1000 #Btio
                },
            ],
            ["quads"]: []
        },
        ["item"]: {
            ["textures"]: [
                { #top
                    ["id"]: Texture.furnaceTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #bottom
                    ["id"]: Texture.furnaceTop,
                    ["settings"]: 0b1000 #Btio
                },
                { #sides
                    ["id"]: Texture.furnaceSide,
                    ["settings"]: 0b1000 #Btio
                },
                { #front
                    ["id"]: Texture.furnaceFrontOff,
                    ["settings"]: 0b1000 #Btio
                },
            ],
            ["quads"]: []
        }
    },
    [Block.chest]: {
        ["block"]: {
            ["textures"]: [
                {
                    ["id"]: Texture.chestTop,
                    ["settings"]: 0b1000
                },
                {
                    ["id"]: Texture.chestTop,
                    ["settings"]: 0b1000
                },
                {
                    ["id"]: Texture.chestSide,
                    ["settings"]: 0b1000
                },
                {
                    ["id"]: Texture.chestFront,
                    ["settings"]: 0b1000
                },
            ],
            ["quads"]: [
                { ["id"]: Quad.smallBlockNegX, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockPosX, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockNegZ, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockPosZ, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockNegY, ["texIndex"]: 0 },
                { ["id"]: Quad.smallBlockPosY, ["texIndex"]: 0 },
                { ["id"]: 0x1F, ["texIndex"]: 0 }
            ]
        },
        ["item"]: { #duplicate data of block
            ["textures"]: [
                {
                    ["id"]: Texture.chestTop,
                    ["settings"]: 0b1000
                },
                {
                    ["id"]: Texture.chestTop,
                    ["settings"]: 0b1000
                },
                {
                    ["id"]: Texture.chestSide,
                    ["settings"]: 0b1000
                },
                {
                    ["id"]: Texture.chestFront,
                    ["settings"]: 0b1000
                },
            ],
            ["quads"]: [
                { ["id"]: Quad.smallBlockNegX, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockPosX, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockNegZ, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockPosZ, ["texIndex"]: 2 },
                { ["id"]: Quad.smallBlockNegY, ["texIndex"]: 0 },
                { ["id"]: Quad.smallBlockPosY, ["texIndex"]: 0 },
                { ["id"]: 0x1F, ["texIndex"]: 0 }
            ]
        }
    }
}

class MeshGen(Peripheral):
    def __init__(self, blockRam:BlockRam, amogus:Amogus, port:IO_Port, portrange):
        self.blockRam = blockRam
        self.amogus = amogus

        self.port = port
        self.portrange = portrange
    
    block = {
        ["pos"]: [0, 0, 0],
        ["breakphase"]: 0
    }
    item = {
        ["pos"]: [0, 0, 0],
        ["id"]: 0
    }
    face = {
        ["texture"]: Texture.empty,
        ["small"]: False,
        ["direction"]: 0,
        ["texSettings"]: 0b0000
    }

    def recieve(self, data:int, port:IO_Port):
        if (port == IO_Port.MESHGEN_BLOCKXY):
            self.block.x = data >> 4
            self.block["pos"][1] = data & 0xF
        elif (port == IO_Port.MESHGEN_BLOCKZ):
            self.block["pos"][2] = data >> 4
        elif (port == IO_Port.MESHGEN_BREAKPHASE):
            self.block["breakPhase"] = data
        elif (port == IO_Port.MESHGEN_ITEMXZ):
            self.item["pos"][0] = (data >> 4) / 2
            self.item["pos"][2] = (data & 0xF) / 2
        elif (port == IO_Port.MESHGEN_ITEMY):
            self.item["pos"][1] = data / 16
        elif (port == IO_Port.MESHGEN_ITEMID):
            self.item["id"] = data
        elif (port == IO_Port.MESHGEN_TEX):
            self.face["texture"] = data
        elif (port == IO_Port.MESHGEN_SETTINGS):
            self.face["small"] = (data & 0b0100_0000) != 0
            self.face["direction"] = (data & 0b0011_0000) >> 4
            self.face["texSettings"] = data & 0b0000_1111
    
    def send(self, port:int):
        if (port == IO_Port.MESHGEN_RENDERFACE):
            self.RenderOverlay(self.block["pos"][0], self.block["pos"][1], self.block["pos"][2], self.block["breakphase"])
            return 0
        if (port == IO_Port.MESHGEN_RENDERITEM):
            self.RenderScene()
            return 0
        if (port == IO_Port.MESHGEN_RENDEROVERLAY):
            self.RenderItem(self.item["pos"][0], self.item["pos"][1], self.item["pos"][2], self.item["id"])
            return 0
        if (port == IO_Port.MESHGEN_RENDERSCENE):
            self.RenderFace(self.block["pos"][0], self.block["pos"][1], self.block["pos"][2], self.face["texture"], self.face["direction"], self.face["small"])
            return 0
    

    def RenderOverlay(self, x:int, y:int, z:int, breakPhase:int):
        texId = 0x1A + breakPhase
        Faces = [
            [-1, 0, 0],
            [1, 0, 0],
            [0, 0, -1],
            [0, 0, 1],
            [0, -1, 0],
            [0, 1, 0],
        ]
        BlockQuads = [
            Quad.fullBlockNegX,
            Quad.fullBlockPosX,
            Quad.fullBlockNegZ,
            Quad.fullBlockPosZ,
            Quad.fullBlockNegY,
            Quad.fullBlockPosY,
        ]
        for i in range(6):
            adj = self.blockRam.getBlock(
                x + Faces[i][0],
                y + Faces[i][1],
                z + Faces[i][2]
            )
            if(not isTransparent(adj)):
                self.RenderQuad(x, y, z, BlockQuads[i], texId, 0b1101)

    def RenderItem(self, x:int, y:int, z:int, itemId:Item):
        item = MeshROM[itemId]["item"]
        if (isBlockItem(itemId)):
            ItemQuads = [
                Quad.blockItemNegY,
                Quad.blockItemPosY,
                Quad.blockItemNegX,
                Quad.blockItemPosX,
                Quad.blockItemNegZ,
                Quad.blockItemPosZ
            ]
            TexIndices = [ 1, 0, 2, 2, 3, 2 ]
            for i in range(6):
                texture = item["textures"][i]
                self.RenderQuad(x, y, z, ItemQuads[i], texture["id"], texture["settings"])
        else:
            for i in range(8):
                quad = item["quads"][i]
                if (quad["id"] == 0x1F):
                    break
                texture = item["textures"][quad["texIndex"]]
                self.RenderQuad(x, y, z, quad["id"], texture["id"], texture["settings"])
        self.RenderQuad(x, y, z, Quad.itemShadow, Texture.shadow, 0b1110)

    def RenderFace(self, x:int, y:int, z:int, texId:Texture, direction:int, small:bool):
        quadId = direction + (8 if small else 0)
        self.RenderQuad(x, y, z, quadId, texId, 0b1000)

    def RenderScene(self):
        for axis in range(3):
            previousFace:Quad = 0
            currentFace:Quad = 0
            previousTexIndex:int = 0
            currentTexIndex:int = 0
            if axis == 0:
                currentFace = Quad.fullBlockNegX
                previousFace = Quad.fullBlockPosX
                currentTexIndex = 2
                previousTexIndex = 2
            elif axis == 1:
                currentFace = Quad.fullBlockNegZ
                previousFace = Quad.fullBlockPosZ
                currentTexIndex = 2
                previousTexIndex = 2
            else:
                currentFace = Quad.fullBlockNegY
                previousFace = Quad.fullBlockPosY
                currentTexIndex = 1
                previousTexIndex = 0
            for a1 in range(8):
                for a2 in range(8):
                    previous:Block = Block.air
                    previousFull = False
                    previousTransparent = False
                    for a3 in range(8):
                        position = []
                        if axis == 0:
                            position = [a3, a1, a2]
                        elif axis == 1:
                            position = [a1, a2, a3]
                        else:
                            position = [a2, a3, a1]
                        current:Block = self.blockRam.getBlock(position[0], position[1], position[2])
                        currentFull = isFull(current)
                        currentTransparent = isTransparent(current)
                        if (axis == 2):
                            if (position[1] == 0 and currentTransparent):
                                self.RenderQuad(position[0], position[1], position[2], Quad.bedrock, Texture.stone, 0b1010)
                            elif (position[1] == 7 and currentFull):
                                texture = MeshROM[current]["block"]["textures"][0]
                                self.RenderQuad(position[0], position[1], position[2], Quad.fullBlockPosY, texture["id"], texture["settings"])
                            if (not currentFull and current != Block.air):
                                blockData = MeshROM[current]["block"]
                                for i in range(7):
                                    quad = blockData["quads"][i]
                                    if (quad["id"] == 0x1F):
                                        break
                                    texture = blockData["textures"][quad["texIndex"]]
                                    self.RenderQuad(position[0], position[1], position[2], quad["id"], texture["id"], texture["settings"])
                        if (current == previous):
                            previous = current
                            previousFull = currentFull
                            previousTransparent = currentTransparent
                            continue
                        if (currentTransparent and previousFull):
                            texture = MeshROM[previous]["block"]["textures"][previousTexIndex]
                            self.RenderQuad(position[0] - (1 if axis == 0 else 0), position[1] - (1 if axis == 2 else 0), position[2] - (1 if axis == 1 else 0), previousFace, texture["id"], texture["settings"])
                        if (previousTransparent and currentFull):
                            texture = MeshROM[current]["block"]["textures"][currentTexIndex]
                            self.RenderQuad(position[0], position[1], position[2], currentFace, texture["id"], texture["settings"])
                        previous = current
                        previousFull = currentFull
                        previousTransparent = currentTransparent
    
    def RenderQuad(self, x:float, y:float, z:float, quadId:Quad, texId:Texture, texSettings:int):
        quad = []
        Uvs = [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0]
        ]
        template = Quads[quadId]
        for i in range(4):
            vertex:Vertex = Vertex(
                x * 16 + template[i][0],
                y * 16 + template[i][1],
                z * 16 + template[i][2],
                Uvs[i][0],
                Uvs[i][1]
            )
            quad[i] = self.amogus.world_to_cam(vertex)
        self.amogus.texture = texId
        self.amogus.settings["cullBackface"] = (texSettings & 0b1000) != 0
        self.amogus.settings["transparent"] = (texSettings & 0b0100) != 0
        self.amogus.settings["inverted"] = (texSettings & 0b0010) != 0
        self.amogus.settings["overlay"] = (texSettings & 0b0001) != 0
        self.amogus.drawQuad(quad)