import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";

export class CraftingRom implements Device {
    recipes: any = {
         //smelting recipes
         ["4"]: Result.stone,
         ["5"]: Result.coal,
         ["9"]: Result.ironIngot,
         ["A"]: Result.glass,

         //crafting recipes
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

    };
    station:Station = 0;
    currentRecipe:string = "000000000"; //use string because 9 hex values just barely don't fit into 32 bits
    inputs = {
        [IO_Port.CRAFTROM]: () => {
            if (this.station == Station.table) {
                for (let i = 0; i < 2; i++) { //shift the recipe as far left in the crafting grid as it will go
                    if (this.currentRecipe[0] + this.currentRecipe[3] + this.currentRecipe[6] == "000") {
                        this.currentRecipe = this.currentRecipe.substring(1) + "0";
                    } else {
                        break;
                    }
                }
                for (let i = 0; i < 2; i++) { //shift the recipe as far up in the crafting grid as it will go
                    if (this.currentRecipe.substring(0, 3) == "000") {
                        this.currentRecipe = this.currentRecipe.substring(3) + "000";
                    } else {
                        break;
                    }
                }
                this.currentRecipe = this.currentRecipe.toLocaleUpperCase();
                if (this.currentRecipe in this.recipes) {
                    return this.recipes[this.currentRecipe];
                } else {
                    return 0;
                }
            } else {
                this.currentRecipe = this.currentRecipe.toLocaleUpperCase();
                if (this.currentRecipe[8] in this.recipes) {
                    return this.recipes[this.currentRecipe[8]];
                } else {
                    return 0;
                }
            }
        }
    };
    outputs = {
        [IO_Port.CRAFTROM]: (i: number) => {
            switch (i) {
                case Station.table:
                    this.station = Station.table;
                    break;
                case Station.furnace:
                    this.station = Station.furnace;
                    break;
                default:
                    this.currentRecipe = this.currentRecipe.substring(1) + (i >> 4).toString(16); //simulate a shift register
            }
        }
    };
}

enum Station {
    table = 0xFD,
    furnace = 0xFE,
}

enum Ingredient {
    air = 0x0,
    stick = 0x1,
    dirt = 0x2,
    stone = 0x3,
    cobble = 0x4,
    log = 0x5,
    leaves = 0x6,
    plank = 0x7,
    coal = 0x8,
    ironOre = 0x9,
    sand = 0xA,
    glass = 0xB,
    sapling = 0xC,
    ironIngot = 0xD,
    apple = 0xE,
    nonstackable = 0xF,
}

enum Result {
    stone = 0x31,
    plank = 0x74,
    table = 0xFD,
    coal = 0x81,
    furnace = 0xFE,
    ironIngot = 0xD1,
    stick = 0x14,
    chest = 0xFF,
    woodPick = 0xF0,
    woodAxe = 0x1F1,
    woodShovel = 0xF2,
    woodSword = 0xF3,
    stonePick = 0xF4,
    stoneAxe = 0xF5,
    stoneShovel = 0xF6,
    stoneSword = 0xF7,
    ironPick = 0xF8,
    ironAxe = 0xF9,
    ironShovel = 0xFA,
    ironSword = 0xFB,
    shears = 0xFC,
    glass = 0xB1,
}