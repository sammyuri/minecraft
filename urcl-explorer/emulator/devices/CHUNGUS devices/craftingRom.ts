import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";

export class CraftingRom implements Device {
    recipes: any = {
         //smelting recipes
         [Ingredients.cobble]: Results.stone,
         [Ingredients.log]: Results.coal,
         [Ingredients.ironOre]: Results.ironIngot,
 
         //crafting recipes
         ["770770000"]: Results.table, //TODO: add other locations
         ["500000000"]: Results.plank, //TODO: add other locations
         ["444404444"]: Results.furnace,
         ["700700000"]: Results.stick, //TODO: add other locations
 
         ["7770E00E0"]: Results.woodPick,
         ["3330E00E0"]: Results.stonePick,
         ["DDD0E00E0"]: Results.ironPick,
 
         ["7707E00E0"]: Results.woodAxe,
         ["07707E00E"]: Results.woodAxe,
         ["3303E00E0"]: Results.stoneAxe,
         ["03303E00E"]: Results.stoneAxe,
         ["DD0DE00E0"]: Results.ironAxe,
         ["0DD0DE00E"]: Results.ironAxe,
 
         ["0700E00E0"]: Results.woodShovel,
         ["700E00E00"]: Results.woodShovel,
         ["00700E00E"]: Results.woodShovel,
         ["0300E00E0"]: Results.stoneShovel,
         ["300E00E00"]: Results.stoneShovel,
         ["00300E00E"]: Results.stoneShovel,
         ["0D00E00E0"]: Results.ironShovel,
         ["00D00E00E"]: Results.ironShovel,
         ["D00E00E00"]: Results.ironShovel,
 
         ["0700700E0"]: Results.woodSword,
         ["00700700E"]: Results.woodSword,
         ["700700E00"]: Results.woodSword,
         ["0300300E0"]: Results.stoneSword,
         ["00300300E"]: Results.stoneSword,
         ["300300E00"]: Results.stoneSword,
         ["0D00D00E0"]: Results.ironSword,
         ["00D00D00E"]: Results.ironSword,
         ["D00D00E00"]: Results.ironSword,
 
         ["0D0D00000"]: Results.shears, //TODO: add other locations

    };
    mode:number = 0;
    currentRecipe:string = "000000000"; //use string because 9 hex values just barely don't fit into 32 bits
       inputs = {
        [IO_Port.CRAFTROM]: () => {
            if (this.mode == Mode.crafting) {
                return this.recipes[this.currentRecipe.toUpperCase()] ?? 0
            } else {
                return this.recipes[this.currentRecipe.substring(8, 9).toUpperCase()] ?? 0
            }
        }
    };
    outputs = {
        [IO_Port.CRAFTROM]: (i: number) => {
            switch (i) {
                case Ingredients.table:
                    this.mode = Mode.crafting;
                    break;
                case Ingredients.furnace:
                    this.mode = Mode.smelting;
                    break;
                default:
                    this.currentRecipe = this.currentRecipe.substring(1, 9) + (i >> 4).toString(16);
            }
        }
    };
}

enum Mode { crafting, smelting };

//TODO: review IDs and ensure up-to-date

enum Ingredients {
    air, //0x0
    nonstackable, //0x1
    dirt, //0x2
    stone, //0x3
    cobble, //0x4
    log, //0x5
    leaves, //0x6
    plank, //0x7
    table, //0x8
    coal, //0x9
    ironOre, //0xA
    sapling, //0xB
    furnace, //0xC
    ironIngot, //0xD
    stick, //0xE
    apple //0xF
}

enum Results {
    stone = 0x31,
    plank = 0x74,
    table = 0x81,
    coal = 0x91,
    furnace = 0xC1,
    ironIngot = 0xD1,
    stick = 0xE4,
    woodPick = 0x10,
    woodAxe = 0x11,
    woodShovel = 0x12,
    woodSword = 0x13,
    stonePick = 0x14,
    stoneAxe = 0x15,
    stoneShovel = 0x16,
    stoneSword = 0x17,
    ironPick = 0x18,
    ironAxe = 0x19,
    ironShovel = 0x1A,
    ironSword = 0x1B,
    shears = 0x1C,
}