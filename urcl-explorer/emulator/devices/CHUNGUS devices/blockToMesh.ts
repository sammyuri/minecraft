import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";
import { BlockRAM } from "./blockRAM.js";
import { Amogus, Vertex, Texture } from "./amogus.js";

export class BlockToMesh implements Device {
    blockRAM:BlockRAM;
    amogus:Amogus;
    constructor(blockRam:BlockRAM, amogus:Amogus) {
        this.blockRAM = blockRam;
        this.amogus = amogus;
    }
    block = {
        x: 0,
        y: 0,
        z: 0,
        breakPhase: 0
    }
    item = {
        x: 0,
        y: 0,
        z: 0,
        id: 0
    }
    face = {
        texture: Texture.empty,

        small: false,
        direction: 0,
        texSettings: 0b0000
    }
    outputs = {
        [IO_Port.MESHGEN_BLOCKXY]: (i:number) => {
            this.block.x = i >> 4;
            this.block.y = i & 0xF;
        },
        [IO_Port.MESHGEN_BLOCKZ]: (i:number) => {
            this.block.z = i >> 4;
        },
        [IO_Port.MESHGEN_BREAKPHASE]: (i:number) => {
            this.block.breakPhase = i;
        },
        [IO_Port.MESHGEN_ITEMXZ]: (i:number) => {
            this.item.x = (i >> 4) / 2;
            this.item.z = (i & 0xF) / 2;
        },
        [IO_Port.MESHGEN_ITEMY]: (i:number) => {
            this.item.y = i / 16;
        },
        [IO_Port.MESHGEN_ITEMID]: (i:number) => {
            this.item.id = i;
        },
        [IO_Port.MESHGEN_TEXID]: (i:number) => {
            this.face.texture = i;
        },
        [IO_Port.MESHGEN_SETTINGS]: (i:number) => {
            this.face.small = (i & 0b0100_0000) != 0;
            this.face.direction = (i & 0b0011_0000) >> 4;
            this.face.texSettings = i & 0b0000_1111;
        }
    }
    inputs = {
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
    }

    RenderItem(x:number, y:number, z:number, itemId:Item):void {
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
            const TexIndices = [ 1, 0, 2, 2, 3, 2 ];
            for (let i = 0; i < 6; i++) {
                let texture = item.textures[i];
                this.RenderQuad(x, y, z, ItemQuads[i], texture.id, texture.settings);
            }
        } else {
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

    RenderFace(x:number, y:number, z:number, texId:Texture, direction:number, small:boolean):void {
        let quadId = direction + (small ? 8 : 0);
        this.RenderQuad(x, y, z, quadId, texId, 0b1000);
    }

    RenderOverlay(x:number, y:number, z:number, breakPhase:number):void {
        let texId = 0x1A + breakPhase;
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
            let adj = this.blockRAM.getBlock(
                x + Faces[i][0],
                y + Faces[i][1],
                z + Faces[i][2]
            );
            if(!this.isTransparent(adj)) {
                this.RenderQuad(x, y, z, BlockQuads[i], texId, 0b1101);
            }

        }
    }

    RenderScene():void {
        for (let axis = 0; axis < 3; axis++) {
            let previousFace:Quad, currentFace:Quad, previousTexIndex:number, currentTexIndex:number;
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
                    let previous:Block = Block.air;
                    let previousFull = false;
                    let previousTransparent = false;
                    for (let a3 = 0; a3 < 8; a3++) {
                        let position:number[] = []
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
                        let current:Block = this.blockRAM.getBlock(position[0], position[1], position[2]);
                        let currentFull = this.isFull(current);
                        let currentTransparent = this.isTransparent(current);
                        if (axis == 2) {
                            if (position[1] == 0 && currentTransparent) {
                                this.RenderQuad(position[0], position[1], position[2], Quad.bedrock, Texture.stone, 0b1010);
                            } else if (position[1] == 7 && currentFull) {
                                let texture = MeshROM[current].block.textures[0];
                                this.RenderQuad(position[0], position[1], position[2], Quad.fullBlockPosY, texture.id, texture.settings);
                            }
                            if (!currentFull && current != Block.air) {
                                let blockData = MeshROM[current].block
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

    RenderQuad(x:number, y:number, z:number, quadId:Quad, texId:Texture, texSettings:number):void {
        let quad:Vertex[] = [];
        const Uvs = [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0]
        ];
        let template = Quads[quadId];
        for (let i = 0; i < 4; i++) {
            let vertex:Vertex = new Vertex(
                x * 16 + template[i][0],
                y * 16 + template[i][1],
                z * 16 + template[i][2],
                Uvs[i][0],
                Uvs[i][1]
            )
            quad[i] = this.amogus.world_to_cam(vertex);
        }
        this.amogus.texture = texId;
        this.amogus.settings.cullBackface = (texSettings & 0b1000) != 0;
        this.amogus.settings.transparent = (texSettings & 0b0100) != 0;
        this.amogus.settings.inverted = (texSettings & 0b0010) != 0;
        this.amogus.settings.overlay = (texSettings & 0b0001) != 0;
        this.amogus.drawQuad(quad);
    }

    isTransparent(blockID:Block):boolean {
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

    isFull(blockID:Block):boolean {
        switch (blockID) {
            case Block.air:
            case Block.sapling:
            case Block.chest:
                return false;
        }
        return true;
    }

    isBlockItem(itemId:Item):boolean {
        switch (itemId) {
            case Item.coal:
            case Item.sapling:
                return false;
        }
        return true;
    }
}

enum Item {
    dirt = 0x2,
    cobble = 0x4,
    log = 0x5,
    leaves = 0x6,
    plank = 0x7,
    coal = 0x8,
    ironOre = 0x9,
    sand = 0xA,
    sapling = 0xC,
    table = 0xD,
    furnace = 0xE,
    chest = 0xF
}

export enum Block {
    air = 0x0,
    grass = 0x1,
    dirt = 0x2,
    stone = 0x3,
    cobble = 0x4,
    log = 0x5,
    leaves = 0x6,
    plank = 0x7,
    coalOre = 0x8,
    ironOre = 0x9,
    sand = 0xA,
    glass = 0xB,
    sapling = 0xC,
    table = 0xD,
    furnace = 0xE,
    chest = 0xF,
}

enum Mesh {
    none, //0x0
    block, //0x1
    cross, //0x2
    smallBlock, //0x3
    blockItem, //0x4
    crossItem2Color, //0x5
    crossItemNoCull, //0x6
    fullNegXFace, //0x7
    fullPosXFace, //0x8
    fullNegZFace, //0x9
    fullPosZFace, //0xA
    smallNegXFace, //0xB
    smallPosXFace, //0xC
    smallNegZFace, //0xD
    smallPosZFace, //0xE
    bedrock //0xF
}

enum Quad {
    fullBlockNegX, //0x00
    fullBlockPosX, //0x01
    fullBlockNegZ, //0x02
    fullBlockPosZ, //0x03
    fullBlockNegY, //0x04
    fullBlockPosY, //0x05

    crossBlock1, //0x06
    crossBlock2, //0x07

    smallBlockNegX, //0x08
    smallBlockPosX, //0x09
    smallBlockNegZ, //0x0A
    smallBlockPosZ, //0x0B
    smallBlockNegY, //0x0C
    smallBlockPosY, //0x0D

    itemShadow, //0x0E

    blockItemNegX, //0x0F
    blockItemPosX, //0x10
    blockItemNegZ, //0x11
    blockItemPosZ, //0x12
    blockItemNegY, //0x13
    blockItemPosY, //0x14

    crossItem1, //0x15
    crossItem2, //0x16
    crossItem3, //0x17
    crossItem4, //0x18

    bedrock //0x19
}

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
}

const Meshes = {
    [Mesh.none]: {
        numQuads: 0,
        quads: []
    },
    [Mesh.block]: {
        numQuads: 6,
        quads: [
            {texture: 0, quad: Quad.fullBlockNegX},
            {texture: 0, quad: Quad.fullBlockPosX},
            {texture: 0, quad: Quad.fullBlockNegZ},
            {texture: 0, quad: Quad.fullBlockPosZ},
            {texture: 2, quad: Quad.fullBlockNegY},
            {texture: 1, quad: Quad.fullBlockPosY}
        ]
    },
    [Mesh.cross]: {
        numQuads: 4,
        quads: [
            {texture: 0, quad: Quad.crossBlock1},
            {texture: 1, quad: Quad.crossBlock1},
            {texture: 0, quad: Quad.crossBlock2},
            {texture: 1, quad: Quad.crossBlock2},
        ]
    },
    [Mesh.smallBlock]: {
        numQuads: 6,
        quads: [
            {texture: 0, quad: Quad.smallBlockNegX},
            {texture: 0, quad: Quad.smallBlockPosX},
            {texture: 0, quad: Quad.smallBlockNegZ},
            {texture: 0, quad: Quad.smallBlockPosZ},
            {texture: 2, quad: Quad.smallBlockNegY},
            {texture: 1, quad: Quad.smallBlockPosY}
        ]
    },
    [Mesh.blockItem]: {
        numQuads: 7,
        quads: [
            {texture: 0, quad: Quad.blockItemNegX},
            {texture: 0, quad: Quad.blockItemPosX},
            {texture: 3, quad: Quad.blockItemNegZ},
            {texture: 0, quad: Quad.blockItemPosZ},
            {texture: 2, quad: Quad.blockItemNegY},
            {texture: 1, quad: Quad.blockItemPosY},
            {texture: 4, quad: Quad.itemShadow} //NOTE: texture 4 is always {texture: Texture.shadow, settings: 0b1110}
        ]
    },
    [Mesh.crossItem2Color]: {
        numQuads: 9,
        quads: [
            {texture: 0, quad: Quad.crossItem1},
            {texture: 1, quad: Quad.crossItem1},
            {texture: 0, quad: Quad.crossItem2},
            {texture: 1, quad: Quad.crossItem2},
            {texture: 0, quad: Quad.crossItem3},
            {texture: 1, quad: Quad.crossItem3},
            {texture: 0, quad: Quad.crossItem4},
            {texture: 1, quad: Quad.crossItem4},
            {texture: 4, quad: Quad.itemShadow} //NOTE: texture 4 is always {id: Texture.shadow, settings: 0b1110}
        ]
    },
    [Mesh.crossItemNoCull]: {
        numQuads: 5,
        quads: [
            {texture: 0, quad: Quad.crossItem1},
            {texture: 1, quad: Quad.crossItem1},
            {texture: 0, quad: Quad.crossItem2},
            {texture: 1, quad: Quad.crossItem2},
            {texture: 4, quad: Quad.crossItem1} //NOTE: texture 4 is always {id: Texture.shadow, settings: 0b1110}
        ]
    },
    [Mesh.fullNegXFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.fullBlockNegX}
        ]
    },
    [Mesh.fullPosXFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.fullBlockPosX}
        ]
    },
    [Mesh.fullNegZFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.fullBlockNegZ}
        ]
    },
    [Mesh.fullPosZFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.fullBlockPosZ}
        ]
    },
    [Mesh.smallNegXFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.smallBlockNegX}
        ]
    },
    [Mesh.smallPosXFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.smallBlockPosX}
        ]
    },
    [Mesh.smallNegZFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.smallBlockNegZ}
        ]
    },
    [Mesh.smallPosZFace]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.smallBlockPosZ}
        ]
    },
    [Mesh.bedrock]: {
        numQuads: 1,
        quads: [
            {texture: 0, quad:Quad.bedrock}
        ]
    }
}

const ItemMeshProperties = {
    [Item.dirt]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.dirt,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.dirt,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.dirt,
                settings: 0b1000 //Btio
            },
            { //front
                id: Texture.dirt,
                settings: 0b1000 //Btio
            },
        ]
    },
    [Item.cobble]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.cobble,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.cobble,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.cobble,
                settings: 0b1000 //Btio
            },
            { //front
                id: Texture.cobble,
                settings: 0b1000 //Btio
            },
        ]
    },
    [Item.log]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.logSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.logTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.logTop,
                settings: 0b1000 //Btio
            },
            { //front
                id: Texture.logSide,
                settings: 0b1000 //Btio
            },
        ]
    },
    [Item.leaves]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.leaves,
                settings: 0b1100 //BTio
            },
            { //top
                id: Texture.leaves,
                settings: 0b1100 //BTio
            },
            { //bottom
                id: Texture.leaves,
                settings: 0b1100 //BTio
            },
            { //front
                id: Texture.leaves,
                settings: 0b1100 //BTio
            },
        ]
    },
    [Item.plank]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.plank,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.plank,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.plank,
                settings: 0b1000 //Btio
            },
            { //front
                id: Texture.plank,
                settings: 0b1000 //Btio
            },
        ]
    },
    [Item.coal]: {
        meshType: Mesh.crossItem2Color,
        textures: [
            { //light pixles
                id: Texture.coalItemLight,
                settings: 0b1100 //BTio
            },
            { //dark pixels
                id: Texture.coalItemDark,
                settings: 0b1110 //BTIo
            },
            { //unused
                id: Texture.empty,
                settings: 0b0000
            },
            { //unused
                id: Texture.empty,
                settings: 0b0000
            }
        ]
    },
    [Item.ironOre]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.ironOre,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.ironOre,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.ironOre,
                settings: 0b1000 //Btio
            },
            { //front
                id: Texture.ironOre,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Item.sand]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.dirt,
                settings: 0b1010 //BtIo
            },
            { //top
                id: Texture.dirt,
                settings: 0b1010 //BtIo
            },
            { //bottom
                id: Texture.dirt,
                settings: 0b1010 //BtIo
            },
            { //front
                id: Texture.dirt,
                settings: 0b1010 //BtIo
            }
        ]
    },
    [Item.sapling]: {
        meshType: Mesh.crossItemNoCull,
        textures: [
            { //light pixels
                id: Texture.saplingLight,
                settings: 0b0100 //bTio
            },
            { //dark pixels
                id: Texture.saplingDark,
                settings: 0b0110 //bTIo
            },
            { //unused
                id:Texture.empty,
                settings: 0b0000
            },
            { //unused
                id:Texture.empty,
                settings: 0b0000
            }
        ]
    },
    [Item.table]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.tableSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.tableTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.plank,
                settings: 0b1000 //Btio
            },
            { //unused
                id: Texture.empty,
                settings: 0b0000
            }
        ]
    },
    [Item.furnace]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.furnaceSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.furnaceTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.furnaceTop,
                settings: 0b1000 //Btio
            },
            { //front
                id: Texture.furnaceFrontOff,
                settings: 0b1000 //Btio
            }
        ],
    },
    [Item.chest]: {
        meshType: Mesh.blockItem,
        textures: [
            { //sides
                id: Texture.chestSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.chestTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.chestTop,
                settings: 0b1000 //Btio
            },
            { //front
                id: Texture.chestFront,
                settings: 0b1000 //Btio
            }
        ]
    }
}

const BlockMeshProperties = {
    [Block.air]: {
        meshType: Mesh.none,
        textures: [
            { //unused
                id: Texture.empty,
                settings: 0b0000
            },
            { //unused
                id: Texture.empty,
                settings: 0b0000
            },
            { //unused
                id: Texture.empty,
                settings: 0b0000
            }
        ]
    },
    [Block.grass]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.grassSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.empty,
                settings: 0b1010 //BtIo
            },
            { //bottom
                id: Texture.dirt,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.dirt]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.dirt,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.dirt,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.dirt,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.stone]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.stone,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.stone,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.stone,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.cobble]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.cobble,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.cobble,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.cobble,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.log]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.logSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.logTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.logTop,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.leaves]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.leaves,
                settings: 0b1100 //BTio
            },
            { //top
                id: Texture.leaves,
                settings: 0b1100 //BTio
            },
            { //bottom
                id: Texture.leaves,
                settings: 0b1100 //BTio
            }
        ]
    },
    [Block.plank]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.plank,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.plank,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.plank,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.coalOre]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.coalOre,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.coalOre,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.coalOre,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.ironOre]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.ironOre,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.ironOre,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.ironOre,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.sand]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.dirt, //inverted looks like sand
                settings: 0b1010 //BtIo
            },
            { //top
                id: Texture.dirt, //inverted looks like sand
                settings: 0b1010 //BtIo
            },
            { //bottom
                id: Texture.dirt, //inverted looks like sand
                settings: 0b1010 //BtIo
            }
        ]
    },
    [Block.glass]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.glass,
                settings: 0b1110 //BTIo
            },
            { //top
                id: Texture.glass,
                settings: 0b1110 //BTIo
            },
            { //bottom
                id: Texture.glass,
                settings: 0b1110 //BTIo
            }
        ]
    },
    [Block.sapling]: {
        meshType: Mesh.cross,
        textures: [
            { //light pixles
                id: Texture.saplingLight,
                settings: 0b0100 //bTio
            },
            { //dark pixels
                id: Texture.saplingDark,
                settings: 0b0110 //bTIo
            },
            { //unused
                id: Texture.empty,
                settings: 0b0000
            }
        ]
    },
    [Block.table]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.tableSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.tableTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.plank,
                settings: 0b1000 //Btio
            }
        ]
    },
    [Block.furnace]: {
        meshType: Mesh.block,
        textures: [
            { //sides
                id: Texture.furnaceSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.furnaceTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.furnaceTop,
                settings: 0b1000 //Btio
            }
        ],
    },
    [Block.chest]: {
        meshType: Mesh.smallBlock,
        textures: [
            { //sides
                id: Texture.chestSide,
                settings: 0b1000 //Btio
            },
            { //top
                id: Texture.chestTop,
                settings: 0b1000 //Btio
            },
            { //bottom
                id: Texture.chestTop,
                settings: 0b1000 //Btio
            }
        ]
    }
}

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
        block: { //grass block
            textures: [
                { //top
                    id: Texture.empty,
                    settings: 0b1010 //BtIo
                },
                { //bottom
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.grassSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {} //no item
    },
    [Block.dirt]: {
        block: { //dirt block
            textures: [
                { //top
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                { //include front face because this block shares data with its item
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: { //data is duplicate of dirt block
            textures: [
                { //top
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.dirt,
                    settings: 0b1000 //Btio
                },
                { //front
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
                { //top
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {}
    },
    [Block.cobble]: {
        block: {
            textures: [
                { //top
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //include front face because this block shares data with its item
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                { //top
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.cobble,
                    settings: 0b1000 //Btio
                },
                { //front
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
                { //top
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.logSide,
                    settings: 0b1000 //Btio
                },
                { //include front face because this block shares data with its item
                    id: Texture.logSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                { //top
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.logTop,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.logSide,
                    settings: 0b1000 //Btio
                },
                { //front
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
                { //top
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                },
                { //bottom
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                },
                { //sides
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                },
                { //include front face because this block shares data with its item
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                { //top
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                },
                { //bottom
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                },
                { //sides
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                },
                { //front
                    id: Texture.leaves,
                    settings: 0b1100 //BTio
                }
            ],
            quads: []
        }
    },
    [Block.plank]: {
        block: {
            textures: [
                { //top
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //include front face because this block shares data with its item
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: {
            textures: [
                { //top
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //front
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
                { //top
                    id: Texture.coalOre,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.coalOre,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.coalOre,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: {
            textures: [
                { //light pixles
                    id: Texture.coalItemLight,
                    settings: 0b1100 //BTio
                },
                { //dark pixels
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
                { //top
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                { //include front face because this block shares data with its item
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: { //identical data to block
            textures: [
                { //top
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.ironOre,
                    settings: 0b1000 //Btio
                },
                { //front
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
                { //top
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                },
                { //bottom
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                },
                { //sides
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                },
                { //include front face because this block shares data with its item
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                }
            ],
            quads: []
        },
        item: {
            textures: [
                { //top
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                },
                { //bottom
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                },
                { //sides
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                },
                { //front
                    id: Texture.dirt, //inverted looks like sand
                    settings: 0b1010 //BtIo
                }
            ],
            quads: []
        }
    },
    [Block.glass]: {
        block: {
            textures: [
                { //top
                    id: Texture.glass,
                    settings: 0b1100 //BTio
                },
                { //bottom
                    id: Texture.glass,
                    settings: 0b1100 //BTio
                },
                { //sides
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
                { //light pixles
                    id: Texture.saplingLight,
                    settings: 0b0100 //bTio
                },
                { //dark pixels
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
                { //light pixles
                    id: Texture.saplingLight,
                    settings: 0b0100 //bTio
                },
                { //dark pixels
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
                { //top
                    id: Texture.tableTop,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.tableSide,
                    settings: 0b1000 //Btio
                },
                { //front
                    id: Texture.tableSide,
                    settings: 0b1000 //Btio
                }
            ],
            quads: []
        },
        item: {
            textures: [
                { //top
                    id: Texture.tableTop,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.plank,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.tableSide,
                    settings: 0b1000 //Btio
                },
                { //front
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
                { //top
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.furnaceSide,
                    settings: 0b1000 //Btio
                },
                { //front
                    id: Texture.furnaceFrontOff,
                    settings: 0b1000 //Btio
                },
            ],
            quads: []
        },
        item: {
            textures: [
                { //top
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                { //bottom
                    id: Texture.furnaceTop,
                    settings: 0b1000 //Btio
                },
                { //sides
                    id: Texture.furnaceSide,
                    settings: 0b1000 //Btio
                },
                { //front
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
        item: { //duplicate data of block
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
}
