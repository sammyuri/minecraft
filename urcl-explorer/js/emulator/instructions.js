import { enum_count, object_map } from "./util.js";
// export 
export var Opcode;
(function (Opcode) {
    // Core Instructions
    Opcode[Opcode["ADD"] = 0] = "ADD";
    Opcode[Opcode["RSH"] = 1] = "RSH";
    Opcode[Opcode["LOD"] = 2] = "LOD";
    Opcode[Opcode["STR"] = 3] = "STR";
    Opcode[Opcode["BGE"] = 4] = "BGE";
    Opcode[Opcode["NOR"] = 5] = "NOR";
    Opcode[Opcode["IMM"] = 6] = "IMM";
    // Basic Instructions
    Opcode[Opcode["SUB"] = 7] = "SUB";
    Opcode[Opcode["JMP"] = 8] = "JMP";
    Opcode[Opcode["MOV"] = 9] = "MOV";
    Opcode[Opcode["NOP"] = 10] = "NOP";
    Opcode[Opcode["LSH"] = 11] = "LSH";
    Opcode[Opcode["INC"] = 12] = "INC";
    Opcode[Opcode["DEC"] = 13] = "DEC";
    Opcode[Opcode["NEG"] = 14] = "NEG";
    Opcode[Opcode["AND"] = 15] = "AND";
    Opcode[Opcode["OR"] = 16] = "OR";
    Opcode[Opcode["NOT"] = 17] = "NOT";
    Opcode[Opcode["XNOR"] = 18] = "XNOR";
    Opcode[Opcode["XOR"] = 19] = "XOR";
    Opcode[Opcode["NAND"] = 20] = "NAND";
    Opcode[Opcode["BRL"] = 21] = "BRL";
    Opcode[Opcode["BRG"] = 22] = "BRG";
    Opcode[Opcode["BRE"] = 23] = "BRE";
    Opcode[Opcode["BNE"] = 24] = "BNE";
    Opcode[Opcode["BOD"] = 25] = "BOD";
    Opcode[Opcode["BEV"] = 26] = "BEV";
    Opcode[Opcode["BLE"] = 27] = "BLE";
    Opcode[Opcode["BRZ"] = 28] = "BRZ";
    Opcode[Opcode["BNZ"] = 29] = "BNZ";
    Opcode[Opcode["BRN"] = 30] = "BRN";
    Opcode[Opcode["BRP"] = 31] = "BRP";
    Opcode[Opcode["PSH"] = 32] = "PSH";
    Opcode[Opcode["POP"] = 33] = "POP";
    Opcode[Opcode["CAL"] = 34] = "CAL";
    Opcode[Opcode["RET"] = 35] = "RET";
    Opcode[Opcode["HLT"] = 36] = "HLT";
    Opcode[Opcode["CPY"] = 37] = "CPY";
    Opcode[Opcode["BRC"] = 38] = "BRC";
    Opcode[Opcode["BNC"] = 39] = "BNC";
    // Complex Instructions
    Opcode[Opcode["MLT"] = 40] = "MLT";
    Opcode[Opcode["DIV"] = 41] = "DIV";
    Opcode[Opcode["MOD"] = 42] = "MOD";
    Opcode[Opcode["BSR"] = 43] = "BSR";
    Opcode[Opcode["BSL"] = 44] = "BSL";
    Opcode[Opcode["SRS"] = 45] = "SRS";
    Opcode[Opcode["BSS"] = 46] = "BSS";
    Opcode[Opcode["SETE"] = 47] = "SETE";
    Opcode[Opcode["SETNE"] = 48] = "SETNE";
    Opcode[Opcode["SETG"] = 49] = "SETG";
    Opcode[Opcode["SETL"] = 50] = "SETL";
    Opcode[Opcode["SETGE"] = 51] = "SETGE";
    Opcode[Opcode["SETLE"] = 52] = "SETLE";
    Opcode[Opcode["SETC"] = 53] = "SETC";
    Opcode[Opcode["SETNC"] = 54] = "SETNC";
    Opcode[Opcode["LLOD"] = 55] = "LLOD";
    Opcode[Opcode["LSTR"] = 56] = "LSTR";
    // IO Instructions
    Opcode[Opcode["IN"] = 57] = "IN";
    Opcode[Opcode["OUT"] = 58] = "OUT";
    // Signed Instructions
    Opcode[Opcode["SDIV"] = 59] = "SDIV";
    Opcode[Opcode["SBRL"] = 60] = "SBRL";
    Opcode[Opcode["SBRG"] = 61] = "SBRG";
    Opcode[Opcode["SBLE"] = 62] = "SBLE";
    Opcode[Opcode["SBGE"] = 63] = "SBGE";
    Opcode[Opcode["SSETL"] = 64] = "SSETL";
    Opcode[Opcode["SSETG"] = 65] = "SSETG";
    Opcode[Opcode["SSETLE"] = 66] = "SSETLE";
    Opcode[Opcode["SSETGE"] = 67] = "SSETGE";
    //----- Debug Instructions
    Opcode[Opcode["__ASSERT"] = 68] = "__ASSERT";
    Opcode[Opcode["__ASSERT0"] = 69] = "__ASSERT0";
    Opcode[Opcode["__ASSERT_EQ"] = 70] = "__ASSERT_EQ";
    Opcode[Opcode["__ASSERT_NEQ"] = 71] = "__ASSERT_NEQ";
    //----- Custom CHUNUGUS Instructions
    Opcode[Opcode["UMLT"] = 72] = "UMLT";
    Opcode[Opcode["ADDV"] = 73] = "ADDV";
    Opcode[Opcode["SUBV"] = 74] = "SUBV";
    Opcode[Opcode["SQRT"] = 75] = "SQRT";
    Opcode[Opcode["CLZ"] = 76] = "CLZ";
    Opcode[Opcode["CTZ"] = 77] = "CTZ";
    Opcode[Opcode["BTC"] = 78] = "BTC";
    Opcode[Opcode["SMLT446"] = 79] = "SMLT446";
    Opcode[Opcode["SDIV444"] = 80] = "SDIV444";
    Opcode[Opcode["SDIV446"] = 81] = "SDIV446";
})(Opcode || (Opcode = {}));
export var Register;
(function (Register) {
    Register[Register["PC"] = 0] = "PC";
    Register[Register["SP"] = 1] = "SP";
})(Register || (Register = {}));
export const register_count = enum_count(Register);
export var Operant_Prim;
(function (Operant_Prim) {
    Operant_Prim[Operant_Prim["Reg"] = 0] = "Reg";
    Operant_Prim[Operant_Prim["Imm"] = 1] = "Imm";
})(Operant_Prim || (Operant_Prim = {}));
export var Operant_Type;
(function (Operant_Type) {
    Operant_Type[Operant_Type["Reg"] = 0] = "Reg";
    Operant_Type[Operant_Type["Imm"] = 1] = "Imm";
    Operant_Type[Operant_Type["Memory"] = 2] = "Memory";
    Operant_Type[Operant_Type["Label"] = 3] = "Label";
    Operant_Type[Operant_Type["Data_Label"] = 4] = "Data_Label";
    Operant_Type[Operant_Type["Constant"] = 5] = "Constant";
    Operant_Type[Operant_Type["String"] = 6] = "String";
})(Operant_Type || (Operant_Type = {}));
export var Operant_Operation;
(function (Operant_Operation) {
    Operant_Operation[Operant_Operation["SET"] = 0] = "SET";
    Operant_Operation[Operant_Operation["GET"] = 1] = "GET";
    Operant_Operation[Operant_Operation["GET_RAM"] = 2] = "GET_RAM";
    Operant_Operation[Operant_Operation["SET_RAM"] = 3] = "SET_RAM";
    Operant_Operation[Operant_Operation["RAM_OFFSET"] = 4] = "RAM_OFFSET";
})(Operant_Operation || (Operant_Operation = {}));
export var URCL_Header;
(function (URCL_Header) {
    URCL_Header[URCL_Header["BITS"] = 0] = "BITS";
    URCL_Header[URCL_Header["MINREG"] = 1] = "MINREG";
    URCL_Header[URCL_Header["MINHEAP"] = 2] = "MINHEAP";
    URCL_Header[URCL_Header["RUN"] = 3] = "RUN";
    URCL_Header[URCL_Header["MINSTACK"] = 4] = "MINSTACK";
})(URCL_Header || (URCL_Header = {}));
export var Constants;
(function (Constants) {
    Constants[Constants["BITS"] = 0] = "BITS";
    Constants[Constants["MSB"] = 1] = "MSB";
    Constants[Constants["SMSB"] = 2] = "SMSB";
    Constants[Constants["MAX"] = 3] = "MAX";
    Constants[Constants["SMAX"] = 4] = "SMAX";
    Constants[Constants["UHALF"] = 5] = "UHALF";
    Constants[Constants["LHALF"] = 6] = "LHALF";
    Constants[Constants["MINREG"] = 7] = "MINREG";
    Constants[Constants["MINHEAP"] = 8] = "MINHEAP";
    Constants[Constants["MINSTACK"] = 9] = "MINSTACK";
})(Constants || (Constants = {}));
export var Header_Operant;
(function (Header_Operant) {
    Header_Operant[Header_Operant["=="] = 0] = "==";
    Header_Operant[Header_Operant["<="] = 1] = "<=";
    Header_Operant[Header_Operant[">="] = 2] = ">=";
})(Header_Operant || (Header_Operant = {}));
export var Header_Run;
(function (Header_Run) {
    Header_Run[Header_Run["ROM"] = 0] = "ROM";
    Header_Run[Header_Run["RAM"] = 1] = "RAM";
})(Header_Run || (Header_Run = {}));
export const urcl_headers = {
    [URCL_Header.BITS]: { def: 8, def_operant: Header_Operant["=="] },
    [URCL_Header.MINREG]: { def: 8 },
    [URCL_Header.MINHEAP]: { def: 16 },
    [URCL_Header.RUN]: { def: Header_Run.ROM, in: Header_Run },
    [URCL_Header.MINSTACK]: { def: 8 },
};
export var IO_Port;
(function (IO_Port) {
    // General
    IO_Port[IO_Port["CPUBUS"] = 0] = "CPUBUS";
    IO_Port[IO_Port["TEXT"] = 1] = "TEXT";
    IO_Port[IO_Port["NUMB"] = 2] = "NUMB";
    IO_Port[IO_Port["SUPPORTED"] = 5] = "SUPPORTED";
    IO_Port[IO_Port["SPECIAL"] = 6] = "SPECIAL";
    IO_Port[IO_Port["PROFILE"] = 7] = "PROFILE";
    // Graphics
    IO_Port[IO_Port["X"] = 8] = "X";
    IO_Port[IO_Port["Y"] = 9] = "Y";
    IO_Port[IO_Port["COLOR"] = 10] = "COLOR";
    IO_Port[IO_Port["BUFFER"] = 11] = "BUFFER";
    IO_Port[IO_Port["G_SPECIAL"] = 15] = "G_SPECIAL";
    // Text
    IO_Port[IO_Port["ASCII"] = 16] = "ASCII";
    IO_Port[IO_Port["CHAR5"] = 17] = "CHAR5";
    IO_Port[IO_Port["CHAR6"] = 18] = "CHAR6";
    IO_Port[IO_Port["ASCII7"] = 19] = "ASCII7";
    IO_Port[IO_Port["UTF8"] = 20] = "UTF8";
    IO_Port[IO_Port["UTF16"] = 21] = "UTF16";
    IO_Port[IO_Port["UTF32"] = 22] = "UTF32";
    IO_Port[IO_Port["T_SPECIAL"] = 23] = "T_SPECIAL";
    // Numbers
    IO_Port[IO_Port["INT"] = 24] = "INT";
    IO_Port[IO_Port["UINT"] = 25] = "UINT";
    IO_Port[IO_Port["BIN"] = 26] = "BIN";
    IO_Port[IO_Port["HEX"] = 27] = "HEX";
    IO_Port[IO_Port["FLOAT"] = 28] = "FLOAT";
    IO_Port[IO_Port["FIXED"] = 29] = "FIXED";
    IO_Port[IO_Port["N_SPECIAL"] = 31] = "N_SPECIAL";
    // Storage
    IO_Port[IO_Port["ADDR"] = 32] = "ADDR";
    IO_Port[IO_Port["BUS"] = 33] = "BUS";
    IO_Port[IO_Port["PAGE"] = 34] = "PAGE";
    IO_Port[IO_Port["S_SPECIAL"] = 39] = "S_SPECIAL";
    // Miscellaneous
    IO_Port[IO_Port["RNG"] = 40] = "RNG";
    IO_Port[IO_Port["NOTE"] = 41] = "NOTE";
    IO_Port[IO_Port["INSTR"] = 42] = "INSTR";
    IO_Port[IO_Port["NLEG"] = 43] = "NLEG";
    IO_Port[IO_Port["WAIT"] = 44] = "WAIT";
    IO_Port[IO_Port["NADDR"] = 45] = "NADDR";
    IO_Port[IO_Port["DATA"] = 46] = "DATA";
    IO_Port[IO_Port["M_SPECIAL"] = 47] = "M_SPECIAL";
    // User defined
    IO_Port[IO_Port["UD1"] = 48] = "UD1";
    IO_Port[IO_Port["UD2"] = 49] = "UD2";
    IO_Port[IO_Port["UD3"] = 50] = "UD3";
    IO_Port[IO_Port["UD4"] = 51] = "UD4";
    IO_Port[IO_Port["UD5"] = 52] = "UD5";
    IO_Port[IO_Port["UD6"] = 53] = "UD6";
    IO_Port[IO_Port["UD7"] = 54] = "UD7";
    IO_Port[IO_Port["UD8"] = 55] = "UD8";
    IO_Port[IO_Port["UD9"] = 56] = "UD9";
    IO_Port[IO_Port["UD10"] = 57] = "UD10";
    IO_Port[IO_Port["UD11"] = 58] = "UD11";
    IO_Port[IO_Port["UD12"] = 59] = "UD12";
    IO_Port[IO_Port["UD13"] = 60] = "UD13";
    IO_Port[IO_Port["UD14"] = 61] = "UD14";
    IO_Port[IO_Port["UD15"] = 62] = "UD15";
    IO_Port[IO_Port["UD16"] = 63] = "UD16";
    //CHUNGUS custom IO
    //Crafting ROM
    IO_Port[IO_Port["CRAFTROM"] = 64] = "CRAFTROM";
    //player input
    IO_Port[IO_Port["PLAYERINPUT"] = 65] = "PLAYERINPUT";
    //block RAM
    IO_Port[IO_Port["BLOCKRAM_X"] = 66] = "BLOCKRAM_X";
    IO_Port[IO_Port["BLOCKRAM_OOBACTIVE"] = 66] = "BLOCKRAM_OOBACTIVE";
    IO_Port[IO_Port["BLOCKRAM_Y"] = 67] = "BLOCKRAM_Y";
    IO_Port[IO_Port["BLOCKRAM_OOBINACTIVE"] = 67] = "BLOCKRAM_OOBINACTIVE";
    IO_Port[IO_Port["BLOCKRAM_Z"] = 68] = "BLOCKRAM_Z";
    IO_Port[IO_Port["BLOCKRAM_ZI"] = 68] = "BLOCKRAM_ZI";
    IO_Port[IO_Port["BLOCKRAM_ID"] = 69] = "BLOCKRAM_ID";
    //blockToMesh
    IO_Port[IO_Port["MESHGEN_BLOCKXY"] = 70] = "MESHGEN_BLOCKXY";
    IO_Port[IO_Port["MESHGEN_BLOCKZ"] = 71] = "MESHGEN_BLOCKZ";
    IO_Port[IO_Port["MESHGEN_BREAKPHASE"] = 72] = "MESHGEN_BREAKPHASE";
    IO_Port[IO_Port["MESHGEN_ITEMXZ"] = 73] = "MESHGEN_ITEMXZ";
    IO_Port[IO_Port["MESHGEN_ITEMY"] = 74] = "MESHGEN_ITEMY";
    IO_Port[IO_Port["MESHGEN_ITEMID"] = 75] = "MESHGEN_ITEMID";
    IO_Port[IO_Port["MESHGEN_TEXID"] = 76] = "MESHGEN_TEXID";
    IO_Port[IO_Port["MESHGEN_SETTINGS"] = 77] = "MESHGEN_SETTINGS";
    IO_Port[IO_Port["MESHGEN_RENDERITEM"] = 75] = "MESHGEN_RENDERITEM";
    IO_Port[IO_Port["MESHGEN_RENDEROVERLAY"] = 76] = "MESHGEN_RENDEROVERLAY";
    IO_Port[IO_Port["MESHGEN_RENDERSCENE"] = 77] = "MESHGEN_RENDERSCENE";
    IO_Port[IO_Port["MESHGEN_RENDERFACE"] = 74] = "MESHGEN_RENDERFACE";
    //AMOGUS
    IO_Port[IO_Port["AMOGUS_CAMX"] = 78] = "AMOGUS_CAMX";
    IO_Port[IO_Port["AMOGUS_CAMY"] = 79] = "AMOGUS_CAMY";
    IO_Port[IO_Port["AMOGUS_CAMZ"] = 80] = "AMOGUS_CAMZ";
    IO_Port[IO_Port["AMOGUS_VERTX"] = 81] = "AMOGUS_VERTX";
    IO_Port[IO_Port["AMOGUS_VERTY"] = 82] = "AMOGUS_VERTY";
    IO_Port[IO_Port["AMOGUS_VERTZ"] = 83] = "AMOGUS_VERTZ";
    IO_Port[IO_Port["AMOGUS_VERTUV"] = 84] = "AMOGUS_VERTUV";
    IO_Port[IO_Port["AMOGUS_CAMROT"] = 86] = "AMOGUS_CAMROT";
    IO_Port[IO_Port["AMOGUS_TEX"] = 87] = "AMOGUS_TEX";
    IO_Port[IO_Port["AMOGUS_SETTINGS"] = 88] = "AMOGUS_SETTINGS";
    IO_Port[IO_Port["AMOGUS_CAMDIRX"] = 78] = "AMOGUS_CAMDIRX";
    IO_Port[IO_Port["AMOGUS_CAMDIRY"] = 79] = "AMOGUS_CAMDIRY";
    IO_Port[IO_Port["AMOGUS_CAMDIRZ"] = 80] = "AMOGUS_CAMDIRZ";
    IO_Port[IO_Port["AMOGUS_COSYAW"] = 81] = "AMOGUS_COSYAW";
    IO_Port[IO_Port["AMOGUS_SINYAW"] = 82] = "AMOGUS_SINYAW";
    IO_Port[IO_Port["AMOGUS_DRAWTOSCREEN"] = 90] = "AMOGUS_DRAWTOSCREEN";
    IO_Port[IO_Port["AMOGUS_SUBMITVERT"] = 91] = "AMOGUS_SUBMITVERT";
    IO_Port[IO_Port["AMOGUS_DRAWQUAD"] = 92] = "AMOGUS_DRAWQUAD";
    IO_Port[IO_Port["AMOGUS_CLEARBUFFER"] = 93] = "AMOGUS_CLEARBUFFER";
    //screen
    IO_Port[IO_Port["SCREEN_NOP"] = 94] = "SCREEN_NOP";
    IO_Port[IO_Port["SCREEN_X1"] = 95] = "SCREEN_X1";
    IO_Port[IO_Port["SCREEN_Y1"] = 96] = "SCREEN_Y1";
    IO_Port[IO_Port["SCREEN_X2"] = 97] = "SCREEN_X2";
    IO_Port[IO_Port["SCREEN_Y2"] = 98] = "SCREEN_Y2";
    IO_Port[IO_Port["SCREEN_DRAWRECT"] = 99] = "SCREEN_DRAWRECT";
    IO_Port[IO_Port["SCREEN_X1_DRAWRECT"] = 100] = "SCREEN_X1_DRAWRECT";
    IO_Port[IO_Port["SCREEN_Y1_DRAWRECT"] = 101] = "SCREEN_Y1_DRAWRECT";
    IO_Port[IO_Port["SCREEN_X2_DRAWRECT"] = 102] = "SCREEN_X2_DRAWRECT";
    IO_Port[IO_Port["SCREEN_Y2_DRAWRECT"] = 103] = "SCREEN_Y2_DRAWRECT";
    IO_Port[IO_Port["SCREEN_CLEARRECT"] = 104] = "SCREEN_CLEARRECT";
    IO_Port[IO_Port["SCREEN_X1_CLEARRECT"] = 105] = "SCREEN_X1_CLEARRECT";
    IO_Port[IO_Port["SCREEN_Y1_CLEARRECT"] = 106] = "SCREEN_Y1_CLEARRECT";
    IO_Port[IO_Port["SCREEN_X2_CLEARRECT"] = 107] = "SCREEN_X2_CLEARRECT";
    IO_Port[IO_Port["SCREEN_Y2_CLEARRECT"] = 108] = "SCREEN_Y2_CLEARRECT";
    IO_Port[IO_Port["SCREEN_DRAWTEX"] = 109] = "SCREEN_DRAWTEX";
    IO_Port[IO_Port["SCREEN_X1_DRAWTEX"] = 110] = "SCREEN_X1_DRAWTEX";
    IO_Port[IO_Port["SCREEN_Y1_DRAWTEX"] = 111] = "SCREEN_Y1_DRAWTEX";
    IO_Port[IO_Port["SCREEN_DRAWINVTEX"] = 112] = "SCREEN_DRAWINVTEX";
    IO_Port[IO_Port["SCREEN_X1_DRAWINVTEX"] = 113] = "SCREEN_X1_DRAWINVTEX";
    IO_Port[IO_Port["SCREEN_Y1_DRAWINVTEX"] = 114] = "SCREEN_Y1_DRAWINVTEX";
    IO_Port[IO_Port["SCREEN_TEXID"] = 115] = "SCREEN_TEXID";
    IO_Port[IO_Port["SCREEN_TEXID_DRAWTEX"] = 116] = "SCREEN_TEXID_DRAWTEX";
    IO_Port[IO_Port["SCREEN_TEXID_DRAWINVTEX"] = 117] = "SCREEN_TEXID_DRAWINVTEX";
    IO_Port[IO_Port["SCREEN_CLEARSCREEN"] = 118] = "SCREEN_CLEARSCREEN";
    IO_Port[IO_Port["SCREEN_BUFFER"] = 119] = "SCREEN_BUFFER";
    IO_Port[IO_Port["GAMEPAD"] = 63] = "GAMEPAD";
    IO_Port[IO_Port["AXIS"] = 62] = "AXIS";
    IO_Port[IO_Port["KEY"] = 61] = "KEY";
})(IO_Port || (IO_Port = {}));
const { SET, GET, GET_RAM: GAM, SET_RAM: SAM, RAM_OFFSET: RAO } = Operant_Operation;
export const Opcodes_operants = {
    //----- Core Instructions
    // Add Op2 to Op3 then put result into Op1
    [Opcode.ADD]: [[SET, GET, GET], (s) => { s.a = s.b + s.c; }],
    // Unsigned right shift Op2 once then put result into Op1
    [Opcode.RSH]: [[SET, GET], (s) => { s.a = s.b >>> 1; }],
    // Copy RAM value pointed to by Op2 into Op1
    [Opcode.LOD]: [[SET, GAM], (s) => { s.a = s.m_get(s.b); }],
    // Copy Op2 into RAM value pointed to by Op1
    [Opcode.STR]: [[SAM, GET], (s) => s.m_set(s.a, s.b)],
    // Branch to address specified by Op1 if Op2 is more than or equal to Op3
    [Opcode.BGE]: [[GET, GET, GET], (s) => { if (s.b >= s.c)
            s.pc = s.a; }],
    [Opcode.SBGE]: [[GET, GET, GET], (s) => { if (s.sb >= s.sc)
            s.pc = s.a; }],
    // Bitwise NOR Op2 and Op3 then put result into Op1
    [Opcode.NOR]: [[SET, GET, GET], (s) => { s.a = ~(s.b | s.c); }],
    // Load immediate
    [Opcode.IMM]: [[SET, GET], (s) => { s.a = s.b; }],
    //----- Basic Instructions
    // Subtract Op3 from Op2 then put result into Op1
    [Opcode.SUB]: [[SET, GET, GET], (s) => { s.a = s.b - s.c; }],
    // Branch to address specified by Op1
    [Opcode.JMP]: [[GET], (s) => { s.pc = s.a; }],
    // Copy Op2 to Op1
    [Opcode.MOV]: [[SET, GET], (s) => { s.a = s.b; }],
    // Copy Op2 to Op1
    [Opcode.NOP]: [[], () => false],
    // Left shift Op2 once then put result into Op1
    [Opcode.LSH]: [[SET, GET], (s) => { s.a = s.b << 1; }],
    // Add 1 to Op2 then put result into Op1
    [Opcode.INC]: [[SET, GET], (s) => { s.a = s.b + 1; }],
    // Subtract 1 from Op2 then put result into Op1
    [Opcode.DEC]: [[SET, GET], (s) => { s.a = s.b - 1; }],
    // Calculates the 2s complement of Op2 then puts answer into Op1
    [Opcode.NEG]: [[SET, GET], (s) => { s.a = -s.b; }],
    // Bitwise AND Op2 and Op3 then put result into Op1
    [Opcode.AND]: [[SET, GET, GET], (s) => { s.a = s.b & s.c; }],
    // Bitwise OR Op2 and Op3 then put result into Op1
    [Opcode.OR]: [[SET, GET, GET], (s) => { s.a = s.b | s.c; }],
    // Bitwise NOT of Op2 then put result into Op1
    [Opcode.NOT]: [[SET, GET], (s) => { s.a = ~s.b; }],
    // Bitwise XNOR Op2 and Op3 then put result into Op1
    [Opcode.XNOR]: [[SET, GET, GET], (s) => { s.a = ~(s.b ^ s.c); }],
    // Bitwise XOR Op2 and Op3 then put result into Op1
    [Opcode.XOR]: [[SET, GET, GET], (s) => { s.a = s.b ^ s.c; }],
    // Bitwise NAND Op2 and Op3 then put result into Op1
    [Opcode.NAND]: [[SET, GET, GET], (s) => { s.a = ~(s.b & s.c); }],
    // Branch to address specified by Op1 if Op2 is less than Op3
    [Opcode.BRL]: [[GET, GET, GET], (s) => { if (s.b < s.c)
            s.pc = s.a; }],
    [Opcode.SBRL]: [[GET, GET, GET], (s) => { if (s.sb < s.sc)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if Op2 is more than Op3
    [Opcode.BRG]: [[GET, GET, GET], (s) => { if (s.b > s.c)
            s.pc = s.a; }],
    [Opcode.SBRG]: [[GET, GET, GET], (s) => { if (s.sb > s.sc)
            s.pc = s.sa; }],
    // Branch to address specified by Op1 if Op2 is equal to Op3
    [Opcode.BRE]: [[GET, GET, GET], (s) => { if (s.b === s.c)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if Op2 is not equal to Op3
    [Opcode.BNE]: [[GET, GET, GET], (s) => { if (s.b !== s.c)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if Op2 is Odd (AKA the lowest bit is active)
    [Opcode.BOD]: [[GET, GET], (s) => { if (s.b & 1)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if Op2 is Even (AKA the lowest bit is not active)
    [Opcode.BEV]: [[GET, GET], (s) => { if (!(s.b & 1))
            s.pc = s.a; }],
    // Branch to address specified by Op1 if Op2 is less than or equal to Op3
    [Opcode.BLE]: [[GET, GET, GET], (s) => { if (s.b <= s.c)
            s.pc = s.a; }],
    [Opcode.SBLE]: [[GET, GET, GET], (s) => { if (s.sb <= s.sc)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if Op2 equal to 0
    [Opcode.BRZ]: [[GET, GET], (s) => { if (s.b === 0)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if Op2 is not equal to 0
    [Opcode.BNZ]: [[GET, GET], (s) => { if (s.b !== 0)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if the result of the previous instruction is negative (AKA the upper most bit is active)
    [Opcode.BRN]: [[GET, GET], (s) => { if (s.b & s.sign_bit)
            s.pc = s.a; }],
    // Branch to address specified by Op1 if the result of the previous instruction is positive (AKA the upper most bit is not active)
    [Opcode.BRP]: [[GET, GET], (s) => { if (!(s.b & s.sign_bit))
            s.pc = s.a; }],
    // Push Op1 onto the value stack
    [Opcode.PSH]: [[GET], (s) => { s.push(s.a); }],
    // Pop from the value stack into Op1
    [Opcode.POP]: [[SET], (s) => { s.a = s.pop(); }],
    // Pushes the address of the next instruction onto the stack then branches to Op1
    [Opcode.CAL]: [[GET], (s) => { s.callStack_push(s.pc); s.pc = s.a; }],
    // Pops from the stack, then branches to that value
    [Opcode.RET]: [[], (s) => { s.pc = s.callStack_pop(); }],
    // Stop Execution emediately after opcode is read
    [Opcode.HLT]: [[], () => true],
    // Copies the value located at the RAM location pointed to by Op2 into the RAM position pointed to by Op1.
    [Opcode.CPY]: [[SAM, GAM], (s) => s.m_set(s.a, s.m_get(s.b))],
    // Branch to Op1 if Op2 + Op3 gives a carry out
    [Opcode.BRC]: [[GET, GET, GET], (s) => { if (s.b + s.c > s.max_value)
            s.pc = s.a; }],
    // Branch to Op1 if Op2 + Op3 does not give a carry out
    [Opcode.BNC]: [[GET, GET, GET], (s) => { if (s.b + s.c <= s.max_value)
            s.pc = s.a; }],
    //----- Complex Instructions
    // Multiply Op2 by Op3 then put the lower half of the answer into Op1
    [Opcode.MLT]: [[SET, GET, GET], (s) => { s.a = s.b * s.c; }],
    // Unsigned division of Op2 by Op3 then put answer into Op1
    [Opcode.DIV]: [[SET, GET, GET], (s) => { s.a = s.b / s.c; }],
    [Opcode.SDIV]: [[SET, GET, GET], (s) => { s.a = s.sb / s.sc; }],
    // Unsigned modulus of Op2 by Op3 then put answer into Op1
    [Opcode.MOD]: [[SET, GET, GET], (s) => { s.a = s.b % s.c; }],
    // Right shift Op2, Op3 times then put result into Op1
    [Opcode.BSR]: [[SET, GET, GET], (s) => { s.a = s.b >>> s.c; }],
    // Left shift Op2, Op3 times then put result into Op1
    [Opcode.BSL]: [[SET, GET, GET], (s) => { s.a = s.b << s.c; }],
    // Signed right shift Op2 once then put result into Op1
    [Opcode.SRS]: [[SET, GET], (s) => { s.a = s.sb >> 1; }],
    // Signed right shift Op2, Op3 times then put result into Op1
    [Opcode.BSS]: [[SET, GET, GET], (s) => { s.a = s.sb >> s.c; }],
    // If Op2 equals Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETE]: [[SET, GET, GET], (s) => { s.a = s.b === s.c ? s.max_value : 0; }],
    // If Op2 is not equal to Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETNE]: [[SET, GET, GET], (s) => { s.a = s.b !== s.c ? s.max_value : 0; }],
    // If Op2 if more than Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETG]: [[SET, GET, GET], (s) => { s.a = s.b > s.c ? s.max_value : 0; }],
    [Opcode.SSETG]: [[SET, GET, GET], (s) => { s.a = s.sb > s.sc ? s.max_value : 0; }],
    // If Op2 if less than Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETL]: [[SET, GET, GET], (s) => { s.a = s.b < s.c ? s.max_value : 0; }],
    [Opcode.SSETL]: [[SET, GET, GET], (s) => { s.a = s.sb < s.sc ? s.max_value : 0; }],
    // If Op2 if greater than or equal to Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETGE]: [[SET, GET, GET], (s) => { s.a = s.b >= s.c ? s.max_value : 0; }],
    [Opcode.SSETGE]: [[SET, GET, GET], (s) => { s.a = s.sb >= s.sc ? s.max_value : 0; }],
    // If Op2 if less than or equal to Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETLE]: [[SET, GET, GET], (s) => { s.a = s.b <= s.c ? s.max_value : 0; }],
    [Opcode.SSETLE]: [[SET, GET, GET], (s) => { s.a = s.sb <= s.sc ? s.max_value : 0; }],
    // If Op2 + Op3 produces a carry out then set Op1 to all ones in binary, else set Op1 to 0
    [Opcode.SETC]: [[SET, GET, GET], (s) => { s.a = s.b + s.c > s.max_value ? s.max_value : 0; }],
    // If Op2 + Op3 does not produce a carry out then set Op1 to all ones in binary, else set Op1 to 0
    [Opcode.SETNC]: [[SET, GET, GET], (s) => { s.a = s.b + s.c <= s.max_value ? s.max_value : 0; }],
    // Copy RAM value pointed to by (Op2 + Op3) into Op1. Where Op2 is the base pointer is Op3 is the offset.
    [Opcode.LLOD]: [[SET, RAO, GAM], (s) => { s.a = s.m_get(s.b + s.c); }],
    // Copy Op3 into RAM value pointed to by (Op1 + Op2). Where Op1 is the base pointer is Op2 is the offset.
    [Opcode.LSTR]: [[RAO, SAM, GET], (s) => s.m_set(s.a + s.b, s.c)],
    //----- IO Instructions
    [Opcode.IN]: [[SET, GET], (s) => s.in(s.b)],
    [Opcode.OUT]: [[GET, GET], (s) => { s.out(s.a, s.b); }],
    //----- Assert Instructions
    [Opcode.__ASSERT]: [[GET], (s) => { if (!s.a)
            fail_assert(s); }],
    [Opcode.__ASSERT0]: [[GET], (s) => { if (s.a)
            fail_assert(s); }],
    [Opcode.__ASSERT_EQ]: [[GET, GET], (s) => { if (s.a !== s.b)
            fail_assert(s); }],
    [Opcode.__ASSERT_NEQ]: [[GET, GET], (s) => { if (s.a === s.b)
            fail_assert(s); }],
    //----- Custom CHUNGUS Instructions
    [Opcode.UMLT]: [[SET, GET, GET], (s) => { s.a = (s.b * s.c) >> s.bits; }],
    [Opcode.ADDV]: [[SET, GET, GET], (s) => { s.a = (((s.b & 0xf0) + (s.c & 0xf0)) & 0xf0) | (((s.b & 0x0f) + (s.c & 0x0f)) & 0x0f); }],
    [Opcode.SUBV]: [[SET, GET, GET], (s) => { s.a = (((s.b & 0xf0) - (s.c & 0xf0)) & 0xf0) | (((s.b & 0x0f) - (s.c & 0x0f)) & 0x0f); }],
    [Opcode.SQRT]: [[SET, GET], (s) => { s.a = Math.sqrt(s.b); }],
    [Opcode.CLZ]: [[SET, GET], (s) => { s.a = Math.clz32(s.b) - 24; }],
    [Opcode.CTZ]: [[SET, GET], (s) => {
            let trailingZeros = 32;
            let num = s.b & -s.b;
            if (num)
                trailingZeros--;
            if (num & 0x0000ffff)
                trailingZeros -= 16;
            if (num & 0x00ff00ff)
                trailingZeros -= 8;
            if (num & 0x0f0f0f0f)
                trailingZeros -= 4;
            if (num & 0x33333333)
                trailingZeros -= 2;
            if (num & 0x55555555)
                trailingZeros -= 1;
            s.a = trailingZeros;
        }],
    [Opcode.BTC]: [[SET, GET,], (s) => {
            let num = s.b - ((s.b >> 1) & 0x55555555);
            num = (num & 0x33333333) + ((num >> 2) & 0x33333333);
            s.a = ((num + (num >> 4) & 0x0f0f0f0f) * 0x01010101) >> 24;
        }],
    [Opcode.SMLT446]: [[SET, GET, GET], (s) => {
            s.a = (s.sb / 16) * (s.sc / 64) * 16;
        }],
    [Opcode.SDIV444]: [[SET, GET, GET], (s) => {
            s.a = (s.c != 0) ? ((s.sb / 16) / (s.sc / 16) * 16) : ((s.b >= 0) ? 0x7f : 0xff);
        }],
    [Opcode.SDIV446]: [[SET, GET, GET], (s) => {
            s.a = (s.c != 0) ? ((s.sb / 16) / (s.sc / 64) * 16) : ((s.b >= 0) ? 0x7f : 0xff);
        }]
};
export const inst_fns = object_map(Opcodes_operants, (key, value) => {
    if (value === undefined) {
        throw new Error("instruction definition undefined");
    }
    return [key, value === null || value === void 0 ? void 0 : value[1]];
}, []);
export const Opcodes_operant_lengths = object_map(Opcodes_operants, (key, value) => {
    if (value === undefined) {
        throw new Error("instruction definition undefined");
    }
    return [key, value[0].length];
}, []);
function fail_assert(ctx) {
    const message = `Assertion failed at pc=${ctx.pc}\n`;
    for (let i = 0; i < message.length; i++) {
        ctx.out(IO_Port.TEXT, message.charCodeAt(i));
    }
}