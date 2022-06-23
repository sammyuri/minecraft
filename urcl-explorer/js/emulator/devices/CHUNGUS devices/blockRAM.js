import { IO_Port } from "../../instructions.js";
import { Block } from "./blockToMesh.js";
export class BlockRAM {
    constructor() {
        this.blockGrid = [
            [
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.coalOre, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.coalOre, Block.coalOre, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.coalOre, Block.coalOre, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.sand, Block.sand, Block.sand, Block.sand,],
            ],
            [
                [Block.stone, Block.stone, Block.ironOre, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.ironOre, Block.ironOre, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.grass, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.grass, Block.grass, Block.grass, Block.stone, Block.coalOre, Block.coalOre, Block.coalOre, Block.stone,],
                [Block.grass, Block.grass, Block.dirt, Block.grass, Block.stone, Block.sand, Block.coalOre, Block.stone,],
                [Block.grass, Block.grass, Block.grass, Block.grass, Block.grass, Block.sand, Block.sand, Block.sand,],
                [Block.grass, Block.grass, Block.grass, Block.grass, Block.sand, Block.sand, Block.sand, Block.sand,],
            ],
            [
                [Block.stone, Block.stone, Block.ironOre, Block.ironOre, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.stone, Block.stone, Block.stone, Block.ironOre, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.grass, Block.grass, Block.stone, Block.stone, Block.stone, Block.stone, Block.ironOre, Block.ironOre,],
                [Block.air, Block.grass, Block.grass, Block.grass, Block.stone, Block.stone, Block.stone, Block.ironOre,],
                [Block.air, Block.air, Block.air, Block.grass, Block.grass, Block.stone, Block.stone, Block.stone,],
                [Block.air, Block.air, Block.log, Block.air, Block.grass, Block.sand, Block.sand, Block.sand,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.sand, Block.sand, Block.sand,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
            ],
            [
                [Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.grass, Block.grass, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.air, Block.air, Block.grass, Block.grass, Block.stone, Block.stone, Block.ironOre, Block.ironOre,],
                [Block.air, Block.air, Block.air, Block.air, Block.grass, Block.stone, Block.sand, Block.ironOre,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.grass, Block.sand, Block.sand,],
                [Block.air, Block.air, Block.log, Block.air, Block.air, Block.air, Block.sand, Block.sand,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
            ],
            [
                [Block.grass, Block.grass, Block.grass, Block.stone, Block.stone, Block.stone, Block.stone, Block.stone,],
                [Block.air, Block.air, Block.grass, Block.grass, Block.grass, Block.stone, Block.stone, Block.sand,],
                [Block.air, Block.air, Block.air, Block.air, Block.grass, Block.grass, Block.stone, Block.sand,],
                [Block.air, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.grass, Block.sand, Block.sand,],
                [Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.sand, Block.sand,],
                [Block.leaves, Block.leaves, Block.log, Block.leaves, Block.leaves, Block.air, Block.air, Block.air,],
                [Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air,],
                [Block.air, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air, Block.air,],
            ],
            [
                [Block.air, Block.air, Block.air, Block.grass, Block.grass, Block.grass, Block.grass, Block.grass,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.grass, Block.grass, Block.sand,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.grass, Block.sand,],
                [Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air, Block.sand,],
                [Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air,],
                [Block.leaves, Block.leaves, Block.log, Block.leaves, Block.leaves, Block.air, Block.air, Block.air,],
                [Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air,],
                [Block.air, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air, Block.air,],
            ],
            [
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.leaves, Block.leaves, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.leaves, Block.leaves, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
            ],
            [
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.leaves, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.leaves, Block.leaves, Block.leaves, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.leaves, Block.air, Block.air, Block.air, Block.air, Block.air,],
                [Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air, Block.air,],
            ]
        ];
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.outputs = {
            [IO_Port.BLOCKRAM_XY]: (i) => {
                this.x = i >> 4;
                this.y = i & 0x0F;
            },
            [IO_Port.BLOCKRAM_Z]: (i) => {
                this.z = i;
            },
            [IO_Port.BLOCKRAM_ID]: (i) => {
                let id = i;
                this.setBlock(this.x, this.y, this.z, id);
            },
            [IO_Port.BLOCKRAM_ZI]: (i) => {
                this.z = i >> 4;
                let id = i & 0xF;
                this.setBlock(this.x, this.y, this.z, id);
            }
        };
        this.inputs = {
            [IO_Port.BLOCKRAM_ID]: () => {
                let id = this.getBlock(this.x, this.y, this.z);
                return id;
            },
            [IO_Port.BLOCKRAM_ZI]: () => {
                return (this.z << 4) | this.getBlock(this.x, this.y, this.z);
            }
        };
    }
    getBlock(x, y, z) {
        if (0 <= x && x < 8) {
            if (0 <= y && y < 8) {
                if (0 <= z && z < 8) {
                    return this.blockGrid[y][7 - z][x];
                }
            }
        }
        return 0;
    }
    setBlock(x, y, z, id) {
        if (0 <= x && x < 8) {
            if (0 <= y && y < 8) {
                if (0 <= z && z < 8) {
                    this.blockGrid[y][7 - z][x] = id;
                }
            }
        }
    }
}