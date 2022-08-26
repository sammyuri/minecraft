import { IO_Port } from "../../instructions.js";
export class CraftingRom {
    constructor() {
        this.recipes = {
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
        this.station = 0;
        this.currentRecipe = "000000000"; //use string because 9 hex values just barely don't fit into 32 bits
        this.inputs = {
            [IO_Port.CRAFTROM]: () => {
                if (this.station == Station.table) {
                    for (let i = 0; i < 2; i++) { //shift the recipe as far left in the crafting grid as it will go
                        if (this.currentRecipe[0] + this.currentRecipe[3] + this.currentRecipe[6] == "000") {
                            this.currentRecipe = this.currentRecipe.substring(1) + "0";
                        }
                        else {
                            break;
                        }
                    }
                    for (let i = 0; i < 2; i++) { //shift the recipe as far up in the crafting grid as it will go
                        if (this.currentRecipe.substring(0, 3) == "000") {
                            this.currentRecipe = this.currentRecipe.substring(3) + "000";
                        }
                        else {
                            break;
                        }
                    }
                    this.currentRecipe = this.currentRecipe.toLocaleUpperCase();
                    if (this.currentRecipe in this.recipes) {
                        return this.recipes[this.currentRecipe];
                    }
                    else {
                        return 0;
                    }
                }
                else {
                    this.currentRecipe = this.currentRecipe.toLocaleUpperCase();
                    console.log(this.currentRecipe[8]);
                    if (this.currentRecipe[8] in this.recipes) {
                        console.log(this.recipes[this.currentRecipe[8]])
                        return this.recipes[this.currentRecipe[8]];
                    }
                    else {
                        return 0;
                    }
                }
            }
        };
        this.outputs = {
            [IO_Port.CRAFTROM]: (i) => {
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
}
var Station;
(function (Station) {
    Station[Station["table"] = 253] = "table";
    Station[Station["furnace"] = 254] = "furnace";
})(Station || (Station = {}));
var Ingredient;
(function (Ingredient) {
    Ingredient[Ingredient["air"] = 0] = "air";
    Ingredient[Ingredient["stick"] = 1] = "stick";
    Ingredient[Ingredient["dirt"] = 2] = "dirt";
    Ingredient[Ingredient["stone"] = 3] = "stone";
    Ingredient[Ingredient["cobble"] = 4] = "cobble";
    Ingredient[Ingredient["log"] = 5] = "log";
    Ingredient[Ingredient["leaves"] = 6] = "leaves";
    Ingredient[Ingredient["plank"] = 7] = "plank";
    Ingredient[Ingredient["coal"] = 8] = "coal";
    Ingredient[Ingredient["ironOre"] = 9] = "ironOre";
    Ingredient[Ingredient["sand"] = 10] = "sand";
    Ingredient[Ingredient["glass"] = 11] = "glass";
    Ingredient[Ingredient["sapling"] = 12] = "sapling";
    Ingredient[Ingredient["ironIngot"] = 13] = "ironIngot";
    Ingredient[Ingredient["apple"] = 14] = "apple";
    Ingredient[Ingredient["nonstackable"] = 15] = "nonstackable";
})(Ingredient || (Ingredient = {}));
var Result;
(function (Result) {
    Result[Result["stone"] = 49] = "stone";
    Result[Result["plank"] = 116] = "plank";
    Result[Result["table"] = 253] = "table";
    Result[Result["coal"] = 129] = "coal";
    Result[Result["furnace"] = 254] = "furnace";
    Result[Result["ironIngot"] = 209] = "ironIngot";
    Result[Result["stick"] = 20] = "stick";
    Result[Result["chest"] = 255] = "chest";
    Result[Result["woodPick"] = 240] = "woodPick";
    Result[Result["woodAxe"] = 497] = "woodAxe";
    Result[Result["woodShovel"] = 242] = "woodShovel";
    Result[Result["woodSword"] = 243] = "woodSword";
    Result[Result["stonePick"] = 244] = "stonePick";
    Result[Result["stoneAxe"] = 245] = "stoneAxe";
    Result[Result["stoneShovel"] = 246] = "stoneShovel";
    Result[Result["stoneSword"] = 247] = "stoneSword";
    Result[Result["ironPick"] = 248] = "ironPick";
    Result[Result["ironAxe"] = 249] = "ironAxe";
    Result[Result["ironShovel"] = 250] = "ironShovel";
    Result[Result["ironSword"] = 251] = "ironSword";
    Result[Result["shears"] = 252] = "shears";
    Result[Result["glass"] = 177] = "glass";
})(Result || (Result = {}));