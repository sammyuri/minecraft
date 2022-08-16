import { IO_Port } from "../../instructions.js";
import { Vertex, Texture } from "./amogus.js";
export class MeshGen {
    constructor(blockRam, amogus) {
        this.block = {
            x: 0,
            y: 0,
            z: 0,
            breakPhase: 0
        };
        this.item = {
            x: 0,
            y: 0,
            z: 0,
            id: 0
        };
        this.face = {
            texture: Texture.empty,
            small: false,
            direction: 0,
            texSettings: 0b0000
        };
        this.outputs = {
            [IO_Port.MESHGEN_BLOCKXZ]: (i) => {
                this.block.x = i >> 4;
                this.block.z = i & 0xF;
            },
            [IO_Port.MESHGEN_BLOCKY]: (i) => {
                this.block.y = i;
            },
            [IO_Port.MESHGEN_BREAKPHASE]: (i) => {
                this.block.breakPhase = i;
            },
            [IO_Port.MESHGEN_ITEMXZ]: (i) => {
                this.item.x = (i >> 4) / 2;
                this.item.z = (i & 0xF) / 2;
            },
            [IO_Port.MESHGEN_ITEMY]: (i) => {
                this.item.y = i / 16;
            },
            [IO_Port.MESHGEN_ITEMID]: (i) => {
                this.item.id = i;
            },
            [IO_Port.MESHGEN_TEXID]: (i) => {
                this.face.texture = i;
            },
            [IO_Port.MESHGEN_SETTINGS]: (i) => {
                this.face.small = (i & 64) != 0;
                this.face.direction = (i & 48) >> 4;
                this.face.texSettings = i & 15;
            }
        };
        this.inputs = {
            [IO_Port.MESHGEN_RENDEROVERLAY]: () => {
                this.RenderOverlay(this.block.x, this.block.y, this.block.z, this.block.breakPhase);
                return 0;
            },
            [IO_Port.MESHGEN_RENDERSCENE]: () => {
                this.RenderScene();
                return 0;
            },
            [IO_Port.MESHGEN_RENDERITEM]: () => {
                this.RenderItem(this.item.x, this.item.y, this.item.z, this.item.id);
                return 0;
            },
            [IO_Port.MESHGEN_RENDERFACE]: () => {
                this.RenderFace(this.block.x, this.block.y, this.block.z, this.face.texture, this.face.direction, this.face.small);
                return 0;
            }
        };
        this.blockRAM = blockRam;
        this.amogus = amogus;
    }
    RenderItem(x, y, z, itemId) {
        let item = MeshROM[itemId].item;
        if (this.isBlockItem(itemId)) {
            const ItemQuads = [
                Quad.blockItemNegY,
                Quad.blockItemPosY,
                Quad.blockItemNegX,
                Quad.blockItemPosX,
                Quad.blockItemNegZ,
                Quad.blockItemPosZ
            ];
            const TexIndices = [1, 0, 2, 2, 3, 2];
            for (let i = 0; i < 6; i++) {
                let texture = item.textures[TexIndices[i]];
                this.RenderQuad(x, y, z, ItemQuads[i], texture.id, texture.settings);
            }
        }
        else {
            for (let i = 0; i < 8; i++) {
                let quad = item.quads[i];
                if (quad.id == 0x1F) {
                    break;
                }
                let texture = item.textures[quad.texIndex];
                this.RenderQuad(x, y, z, quad.id, texture.id, texture.settings);
            }
        }
        this.RenderQuad(x, y, z, Quad.itemShadow, Texture.shadow, 0b1110);
    }
    RenderFace(x, y, z, texId, direction, small) {
        let quadId = direction + (small ? 8 : 0);
        this.RenderQuad(x, y, z, quadId, texId, 0b1000);
    }
    RenderOverlay(x, y, z, breakPhase) {
        let texId = Texture.break0 + breakPhase;
        const Faces = [
            [-1, 0, 0],
            [1, 0, 0],
            [0, 0, -1],
            [0, 0, 1],
            [0, -1, 0],
            [0, 1, 0],
        ];
        const BlockQuads = [
            Quad.fullBlockNegX,
            Quad.fullBlockPosX,
            Quad.fullBlockNegZ,
            Quad.fullBlockPosZ,
            Quad.fullBlockNegY,
            Quad.fullBlockPosY,
        ];
        for (let i = 0; i < 6; i++) {
            let adj = this.blockRAM.getBlock(x + Faces[i][0], y + Faces[i][1], z + Faces[i][2]);
            if (this.isTransparent(adj)) {
                this.RenderQuad(x, y, z, BlockQuads[i], texId, 0b1101);
            }
        }
    }
    RenderScene() {
        for (let axis = 0; axis < 3; axis++) {
            let previousFace, currentFace, previousTexIndex, currentTexIndex;
            switch (axis) {
                case 0:
                    currentFace = Quad.fullBlockNegX;
                    previousFace = Quad.fullBlockPosX;
                    currentTexIndex = 2;
                    previousTexIndex = 2;
                    break;
                case 1:
                    currentFace = Quad.fullBlockNegZ;
                    previousFace = Quad.fullBlockPosZ;
                    currentTexIndex = 2;
                    previousTexIndex = 2;
                    break;
                default: //case 2:
                    currentFace = Quad.fullBlockNegY;
                    previousFace = Quad.fullBlockPosY;
                    currentTexIndex = 1;
                    previousTexIndex = 0;
                    break;
            }
            for (let a1 = 0; a1 < 8; a1++) {
                for (let a2 = 0; a2 < 8; a2++) {
                    let previous = Block.air;
                    let previousFull = false;
                    let previousTransparent = false;
                    for (let a3 = 0; a3 < 8; a3++) {
                        let position = [];
                        switch (axis) { //rotate a1, a2, a3 based on axis
                            case 0:
                                position = [a3, a1, a2];
                                break;
                            case 1:
                                position = [a1, a2, a3];
                                break;
                            case 2:
                                position = [a2, a3, a1];
                                break;
                        }
                        let current = this.blockRAM.getBlock(position[0], position[1], position[2]);
                        let currentFull = this.isFull(current);
                        let currentTransparent = this.isTransparent(current);
                        if (axis == 2) {
                            if (position[1] == 0 && currentTransparent) {
                                this.RenderQuad(position[0], position[1], position[2], Quad.bedrock, Texture.stone, 0b1010);
                            }
                            else if (position[1] == 7 && currentFull) {
                                let texture = MeshROM[current].block.textures[0];
                                this.RenderQuad(position[0], position[1], position[2], Quad.fullBlockPosY, texture.id, texture.settings);
                            }
                            if (!currentFull && current != Block.air) {
                                let blockData = MeshROM[current].block;
                                for (let i = 0; i < 8; i++) {
                                    let quad = blockData.quads[i];
                                    if (quad.id == 0x1F) {
                                        break;
                                    }
                                    let texture = blockData.textures[quad.texIndex];
                                    this.RenderQuad(position[0], position[1], position[2], quad.id, texture.id, texture.settings);
                                }
                            }
                        }
                        if (current == previous) {
                            previous = current;
                            previousFull = currentFull;
                            previousTransparent = currentTransparent;
                            continue;
                        }
                        if (currentTransparent && previousFull) {
                            let texture = MeshROM[previous].block.textures[previousTexIndex];
                            this.RenderQuad(position[0] - (axis == 0 ? 1 : 0), position[1] - (axis == 2 ? 1 : 0), position[2] - (axis == 1 ? 1 : 0), previousFace, texture.id, texture.settings);
                        }
                        if (previousTransparent && currentFull) {
                            let texture = MeshROM[current].block.textures[currentTexIndex];
                            this.RenderQuad(position[0], position[1], position[2], currentFace, texture.id, texture.settings);
                        }
                        previous = current;
                        previousFull = currentFull;
                        previousTransparent = currentTransparent;
                    }
                }
            }
        }
    }
    RenderQuad(x, y, z, quadId, texId, texSettings) {
        let quad = [];
        const Uvs = [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0]
        ];
        let template = Quads[quadId];
        for (let i = 0; i < 4; i++) {
            let vertex = new Vertex(x * 16 + template[i][0], y * 16 + template[i][1], z * 16 + template[i][2], Uvs[i][0], Uvs[i][1]);
            quad[i] = this.amogus.world_to_cam(vertex);
        }
        this.amogus.texture = texId;
        this.amogus.settings.cullBackface = (texSettings & 0b1000) != 0;
        this.amogus.settings.transparent = (texSettings & 0b0100) != 0;
        this.amogus.settings.inverted = (texSettings & 0b0010) != 0;
        this.amogus.settings.overlay = (texSettings & 0b0001) != 0;
        this.amogus.drawQuad(quad);
    }
    isTransparent(blockID) {
        switch (blockID) {
            case Block.air:
            case Block.leaves:
            case Block.sapling:
            case Block.glass:
            case Block.chest:
                return true;
        }
        return false;
    }
    isFull(blockID) {
        switch (blockID) {
            case Block.air:
            case Block.sapling:
            case Block.chest:
                return false;
        }
        return true;
    }
    isBlockItem(itemId) {
        switch (itemId) {
            case Item.coal:
            case Item.sapling:
            case Item.stick:
            case Item.apple:
                return false;
        }
        return true;
    }
}
var Item;
(function (Item) {
    Item[Item["stick"] = 1] = "stick";
    Item[Item["dirt"] = 2] = "dirt";
    Item[Item["apple"] = 3] = "apple";
    Item[Item["cobble"] = 4] = "cobble";
    Item[Item["log"] = 5] = "log";
    Item[Item["leaves"] = 6] = "leaves";
    Item[Item["plank"] = 7] = "plank";
    Item[Item["coal"] = 8] = "coal";
    Item[Item["ironOre"] = 9] = "ironOre";
    Item[Item["sand"] = 10] = "sand";
    Item[Item["sapling"] = 12] = "sapling";
    Item[Item["table"] = 13] = "table";
    Item[Item["furnace"] = 14] = "furnace";
    Item[Item["chest"] = 15] = "chest";
})(Item || (Item = {}));
export var Block;
(function (Block) {
    Block[Block["air"] = 0] = "air";
    Block[Block["grass"] = 1] = "grass";
    Block[Block["dirt"] = 2] = "dirt";
    Block[Block["stone"] = 3] = "stone";
    Block[Block["cobble"] = 4] = "cobble";
    Block[Block["log"] = 5] = "log";
    Block[Block["leaves"] = 6] = "leaves";
    Block[Block["plank"] = 7] = "plank";
    Block[Block["coalOre"] = 8] = "coalOre";
    Block[Block["ironOre"] = 9] = "ironOre";
    Block[Block["sand"] = 10] = "sand";
    Block[Block["glass"] = 11] = "glass";
    Block[Block["sapling"] = 12] = "sapling";
    Block[Block["table"] = 13] = "table";
    Block[Block["furnace"] = 14] = "furnace";
    Block[Block["chest"] = 15] = "chest";
})(Block || (Block = {}));
var Quad;
(function (Quad) {
    Quad[Quad["fullBlockNegX"] = 0] = "fullBlockNegX";
    Quad[Quad["fullBlockPosX"] = 1] = "fullBlockPosX";
    Quad[Quad["fullBlockNegZ"] = 2] = "fullBlockNegZ";
    Quad[Quad["fullBlockPosZ"] = 3] = "fullBlockPosZ";
    Quad[Quad["fullBlockNegY"] = 4] = "fullBlockNegY";
    Quad[Quad["fullBlockPosY"] = 5] = "fullBlockPosY";
    Quad[Quad["crossBlock1"] = 6] = "crossBlock1";
    Quad[Quad["crossBlock2"] = 7] = "crossBlock2";
    Quad[Quad["smallBlockNegX"] = 8] = "smallBlockNegX";
    Quad[Quad["smallBlockPosX"] = 9] = "smallBlockPosX";
    Quad[Quad["smallBlockNegZ"] = 10] = "smallBlockNegZ";
    Quad[Quad["smallBlockPosZ"] = 11] = "smallBlockPosZ";
    Quad[Quad["smallBlockNegY"] = 12] = "smallBlockNegY";
    Quad[Quad["smallBlockPosY"] = 13] = "smallBlockPosY";
    Quad[Quad["itemShadow"] = 14] = "itemShadow";
    Quad[Quad["blockItemNegX"] = 15] = "blockItemNegX";
    Quad[Quad["blockItemPosX"] = 16] = "blockItemPosX";
    Quad[Quad["blockItemNegZ"] = 17] = "blockItemNegZ";
    Quad[Quad["blockItemPosZ"] = 18] = "blockItemPosZ";
    Quad[Quad["blockItemNegY"] = 19] = "blockItemNegY";
    Quad[Quad["blockItemPosY"] = 20] = "blockItemPosY";
    Quad[Quad["crossItem1"] = 21] = "crossItem1";
    Quad[Quad["crossItem2"] = 22] = "crossItem2";
    Quad[Quad["crossItem3"] = 23] = "crossItem3";
    Quad[Quad["crossItem4"] = 24] = "crossItem4";
    Quad[Quad["bedrock"] = 25] = "bedrock"; //0x19
})(Quad || (Quad = {}));
const Quads = {
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
};
const MeshROM = {
    [Block.air]: {
        block: {
            textures: [],
            quads: []
        },
        item: {
            textures: [],
            quads: []
        }
    },
    [Block.grass]: {
        block: {
            textures: [
                {
                    id: Texture.empty,
                    settings: 0b1010 //BtIo
                },
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.grassSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.stickItemLight,
                    settings: 0b1100 //BTio
                },
                {
                    id: Texture.stickItemDark,
                    settings: 0b1110 //BTio
                }
            ],
            quads: [
                { id: Quad.crossItem1, texIndex: 0 },
                { id: Quad.crossItem1, texIndex: 1 },
                { id: Quad.crossItem2, texIndex: 0 },
                { id: Quad.crossItem2, texIndex: 1 },
                { id: Quad.crossItem3, texIndex: 0 },
                { id: Quad.crossItem3, texIndex: 1 },
                { id: Quad.crossItem4, texIndex: 0 },
                { id: Quad.crossItem4, texIndex: 1 }
            ]
        }
    },
    [Block.dirt]: {
        block: {
            textures: [
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        }
    },
    [Block.stone]: {
        block: {
            textures: [
                {
                    id: Texture.stone,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.stone,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.stone,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.appleItemLight,
                    settings: 0b1100 //BTio
                },
                {
                    id: Texture.appleItemDark,
                    settings: 0b1110 //BTio
                }
            ],
            quads: [
                { id: Quad.crossItem1, texIndex: 0 },
                { id: Quad.crossItem1, texIndex: 1 },
                { id: Quad.crossItem2, texIndex: 0 },
                { id: Quad.crossItem2, texIndex: 1 },
                { id: Quad.crossItem3, texIndex: 0 },
                { id: Quad.crossItem3, texIndex: 1 },
                { id: Quad.crossItem4, texIndex: 0 },
                { id: Quad.crossItem4, texIndex: 1 }
            ]
        }
    },
    [Block.cobble]: {
        block: {
            textures: [
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        }
    },
    [Block.log]: {
        block: {
            textures: [
                {
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.logSide,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.logSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.logSide,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.logSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        }
    },
    [Block.leaves]: {
        block: {
            textures: [
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                },
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                },
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                },
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                },
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                },
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                },
                {
                    id: Texture.leaves,
                    settings: 0b1000 //BTio
                }
            ],
            quads: []
        }
    },
    [Block.plank]: {
        block: {
            textures: [
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        }
    },
    [Block.coalOre]: {
        block: {
            textures: [
                {
                    id: Texture.coalOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.coalOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.coalOre,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.coalItemLight,
                    settings: 0b1100 //BTio
                },
                {
                    id: Texture.coalItemDark,
                    settings: 0b1110 //BTIo
                }
            ],
            quads: [
                { id: Quad.crossItem1, texIndex: 0 },
                { id: Quad.crossItem1, texIndex: 1 },
                { id: Quad.crossItem2, texIndex: 0 },
                { id: Quad.crossItem2, texIndex: 1 },
                { id: Quad.crossItem3, texIndex: 0 },
                { id: Quad.crossItem3, texIndex: 1 },
                { id: Quad.crossItem4, texIndex: 0 },
                { id: Quad.crossItem4, texIndex: 1 },
            ]
        }
    },
    [Block.ironOre]: {
        block: {
            textures: [
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        }
    },
    [Block.sand]: {
        block: {
            textures: [
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                },
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                },
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                },
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                },
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                },
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                },
                {
                    id: Texture.dirt,
                    settings: 0b1010 //BtIo
                }
            ],
            quads: []
        }
    },
    [Block.glass]: {
        block: {
            textures: [
                {
                    id: Texture.glass,
                    settings: 0b1100 //BTio
                },
                {
                    id: Texture.glass,
                    settings: 0b1100 //BTio
                },
                {
                    id: Texture.glass,
                    settings: 0b1100 //BTio
                },
            ],
            quads: []
        },
        item: {}
    },
    [Block.sapling]: {
        block: {
            textures: [
                {
                    id: Texture.saplingLight,
                    settings: 0b0100 //bTio
                },
                {
                    id: Texture.saplingDark,
                    settings: 0b0110 //bTIo
                }
            ],
            quads: [
                { id: Quad.crossBlock1, texIndex: 0 },
                { id: Quad.crossBlock1, texIndex: 1 },
                { id: Quad.crossBlock2, texIndex: 0 },
                { id: Quad.crossBlock2, texIndex: 1 },
                { id: 0x1F, texIndex: 0 }
            ]
        },
        item: {
            textures: [
                {
                    id: Texture.saplingLight,
                    settings: 0b0100 //bTio
                },
                {
                    id: Texture.saplingDark,
                    settings: 0b0110 //bTIo
                }
            ],
            quads: [
                { id: Quad.crossItem1, texIndex: 0 },
                { id: Quad.crossItem1, texIndex: 1 },
                { id: Quad.crossItem2, texIndex: 0 },
                { id: Quad.crossItem2, texIndex: 1 },
                { id: 0x1F, texIndex: 0 }
            ]
        }
    },
    [Block.table]: {
        block: {
            textures: [
                {
                    id: Texture.tableTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.tableSide,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.tableSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.tableTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.tableSide,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.tableSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        }
    },
    [Block.furnace]: {
        block: {
            textures: [
                {
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.furnaceSide,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.furnaceFrontOff,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: {
            textures: [
                {
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.furnaceSide,
                    settings: 0b1000 //Btio
                },
                {
                    id: Texture.furnaceFrontOff,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        }
    },
    [Block.chest]: {
        block: {
            textures: [
                {
                    id: Texture.chestTop,
                    settings: 0b1000
                },
                {
                    id: Texture.chestTop,
                    settings: 0b1000
                },
                {
                    id: Texture.chestSide,
                    settings: 0b1000
                },
                {
                    id: Texture.chestFront,
                    settings: 0b1000
                },
            ],
            quads: [
                { id: Quad.smallBlockNegX, texIndex: 2 },
                { id: Quad.smallBlockPosX, texIndex: 2 },
                { id: Quad.smallBlockNegZ, texIndex: 2 },
                { id: Quad.smallBlockPosZ, texIndex: 2 },
                { id: Quad.smallBlockNegY, texIndex: 0 },
                { id: Quad.smallBlockPosY, texIndex: 0 },
                { id: 0x1F, texIndex: 0 }
            ]
        },
        item: {
            textures: [
                {
                    id: Texture.chestTop,
                    settings: 0b1000
                },
                {
                    id: Texture.chestTop,
                    settings: 0b1000
                },
                {
                    id: Texture.chestSide,
                    settings: 0b1000
                },
                {
                    id: Texture.chestFront,
                    settings: 0b1000
                },
            ],
            quads: [
                { id: Quad.smallBlockNegX, texIndex: 2 },
                { id: Quad.smallBlockPosX, texIndex: 2 },
                { id: Quad.smallBlockNegZ, texIndex: 2 },
                { id: Quad.smallBlockPosZ, texIndex: 2 },
                { id: Quad.smallBlockNegY, texIndex: 0 },
                { id: Quad.smallBlockPosY, texIndex: 0 },
                { id: 0x1F, texIndex: 0 }
            ]
        }
    }
};