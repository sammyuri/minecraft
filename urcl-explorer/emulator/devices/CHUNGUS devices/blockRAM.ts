import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";
import { Block } from "./blockToMesh.js"

export class BlockRAM implements Device {
    blockGrid:number[][][] = [
        [
            [ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
            [ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
            [ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone ,Block.coalOre, Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone ,Block.coalOre,Block.coalOre, Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone ,Block.coalOre,Block.coalOre, Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.sand  , Block.sand  , Block.sand  , Block.sand  , ],
        ],
        [
    		[ Block.stone , Block.stone ,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone ,Block.ironOre,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.grass , Block.grass , Block.stone ,Block.coalOre,Block.coalOre,Block.coalOre, Block.stone , ],
    		[ Block.grass , Block.grass , Block.dirt  , Block.grass , Block.stone , Block.sand  ,Block.coalOre, Block.stone , ],
    		[ Block.grass , Block.grass , Block.grass , Block.grass , Block.grass , Block.sand  , Block.sand  , Block.sand  , ],
    		[ Block.grass , Block.grass , Block.grass , Block.grass , Block.sand  , Block.sand  , Block.sand  , Block.sand  , ],
        ],
        [
    		[ Block.stone , Block.stone ,Block.ironOre,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone ,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , Block.stone ,Block.ironOre,Block.ironOre, ],
    		[ Block.air   , Block.grass , Block.grass , Block.grass , Block.stone , Block.stone , Block.stone ,Block.ironOre, ],
    		[ Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , ],
    		[ Block.air   , Block.air   , Block.log   , Block.air   , Block.grass , Block.sand  , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.sand  , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.air   , Block.air   , Block.grass , Block.grass , Block.stone , Block.stone ,Block.ironOre,Block.ironOre, ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.stone , Block.sand  ,Block.ironOre, ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.log   , Block.air   , Block.air   , Block.air   , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.grass , Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.air   , Block.air   , Block.grass , Block.grass , Block.grass , Block.stone , Block.stone , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.stone , Block.sand  , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.grass , Block.sand  , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.sand  , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.log   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
		[
    		[ Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.grass , Block.grass , Block.grass , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.leaves, Block.leaves, Block.log   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ]
    ];
    x = 0;
    y = 0;
    z = 0;

	outputs = {
        [IO_Port.BLOCKRAM_X]: (i:number) => {
            this.x = i;
        },
        [IO_Port.BLOCKRAM_Y]: (i:number) => {
            this.y = i;
        },
		[IO_Port.BLOCKRAM_Z]: (i:number) => {
			this.z = i;
		},
		[IO_Port.BLOCKRAM_ID]: (i:number) => {
			let id = i;
			this.setBlock(this.x, this.y, this.z, id);
		}
    }

    inputs = {
        [IO_Port.BLOCKRAM_ID]: () => {
            let id = this.getBlock(this.x, this.y, this.z);
			return id;
        },
        [IO_Port.BLOCKRAM_ZI]: () => {
			let id = this.getBlock(this.x, this.y, this.z);
            return (this.z << 4) | id;
        }
    }

	public getBlock(x:number, y:number, z:number):number {
		if (0 <= x && x < 8) {
			if (0 <= y && y < 8) {
				if (0 <= z && z < 8) {
					return this.blockGrid[y][7-z][x];
				}
			}
		}
		return 0;
	}

	public setBlock(x:number, y:number, z:number, id:number) {
		if (0 <= x && x < 8) {
			if (0 <= y && y < 8) {
				if (0 <= z && z < 8) {
					this.blockGrid[y][7-z][x] = id;
				}
			}
		}
	}
}