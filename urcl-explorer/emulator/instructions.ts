import {enum_count, object_map} from "./util.js";

// export 
export enum Opcode {
    // Core Instructions
    ADD, RSH, LOD, STR, BGE, NOR, IMM,
    // Basic Instructions
    SUB, JMP, MOV, NOP, LSH, INC, DEC, NEG,
    AND, OR, NOT, XNOR, XOR, NAND,
    BRL, BRG, BRE, BNE, BOD, BEV, BLE, BRZ,
    BNZ, BRN, BRP, PSH, POP, CAL, RET, HLT,
    CPY, BRC, BNC,

    // Complex Instructions
    MLT, DIV, MOD, BSR, BSL, SRS, BSS,
    SETE, SETNE, SETG, SETL, SETGE, SETLE,
    SETC, SETNC, LLOD, LSTR,

    // IO Instructions
    IN, OUT,
    
    // Signed Instructions
    SDIV, SBRL, SBRG, SBLE , SBGE, SSETL, SSETG, SSETLE, SSETGE,

    //----- Debug Instructions
    __ASSERT,
    __ASSERT0,
    __ASSERT_EQ,
    __ASSERT_NEQ,

    //----- Custom CHUNUGUS Instructions
    UMLT, //uper word mult
    ADDV, //vector add
    SUBV, //vector subtract
    SQRT, //square root
    CLZ, //count leading zeros
    CTZ, //count trailing zeros
    BTC, //bit count (count ones)
}

export enum Register {
    PC, SP
}
export const register_count = enum_count(Register);

export enum Operant_Prim {
    Reg, Imm,
}

export enum Operant_Type {
    Reg = Operant_Prim.Reg, Imm = Operant_Prim.Imm,
    Memory, Label, Data_Label, Constant, String
}

export enum Operant_Operation {
    SET, GET, GET_RAM, SET_RAM, RAM_OFFSET
}

export enum URCL_Header {
    BITS, MINREG, MINHEAP, RUN, MINSTACK
}

export enum Constants {
    BITS, MSB, SMSB, MAX, SMAX, UHALF, LHALF,
    MINREG, MINHEAP, MINSTACK
}


export enum Header_Operant {
    "==", "<=", ">="
}
export enum Header_Run {
    ROM, RAM
}

interface URCL_Header_Def {
    def: number,
    def_operant?: Header_Operant,
    in?: Record<string, unknown>
}

export const urcl_headers: Record<URCL_Header, URCL_Header_Def> = {
    [URCL_Header.BITS]: {def: 8, def_operant: Header_Operant["=="]},
    [URCL_Header.MINREG]: {def: 8},
    [URCL_Header.MINHEAP]: {def: 16},
    [URCL_Header.RUN]: {def: Header_Run.ROM, in: Header_Run},
    [URCL_Header.MINSTACK]: {def: 8},
}

export enum IO_Port {
    // General
    CPUBUS, TEXT, NUMB, SUPPORTED = 5, SPECIAL, PROFILE,
    // Graphics
    X, Y, COLOR, BUFFER, G_SPECIAL = 15,
    // Text
    ASCII, CHAR5, CHAR6, ASCII7, UTF8, UTF16, UTF32, T_SPECIAL = 23,
    // Numbers
    INT, UINT, BIN, HEX, FLOAT, FIXED, N_SPECIAL=31,
    // Storage
    ADDR, BUS, PAGE, S_SPECIAL=39,
    // Miscellaneous
    RNG, NOTE, INSTR, NLEG, WAIT, NADDR, DATA, M_SPECIAL,
    // User defined
    UD1, UD2, UD3, UD4, UD5, UD6, UD7, UD8, UD9, UD10, UD11, UD12, UD13, UD14, UD15, UD16,

    //CHUNGUS custom IO
        //Crafting ROM
        CRAFTROM,
        //player input
        PLAYERINPUT,
        //block RAM
        BLOCKRAM_XY, BLOCKRAM_Z, BLOCKRAM_ID, BLOCKRAM_ZI,
        //blockToMesh
        MESHGEN_BLOCKXY, MESHGEN_BLOCKZ, MESHGEN_BREAKPHASE, MESHGEN_ITEMXZ, MESHGEN_ITEMY, MESHGEN_ITEMID, MESHGEN_TEXID, MESHGEN_SETTINGS,
        MESHGEN_RENDERITEM = MESHGEN_ITEMID, MESHGEN_RENDEROVERLAY = MESHGEN_TEXID, MESHGEN_RENDERSCENE = MESHGEN_SETTINGS, MESHGEN_RENDERFACE = MESHGEN_ITEMY,
        //AMOGUS
        AMOGUS_CAMX = MESHGEN_SETTINGS + 1, AMOGUS_CAMY, AMOGUS_CAMZ,
        AMOGUS_VERTX, AMOGUS_VERTY, AMOGUS_VERTZ, AMOGUS_VERTUV,
        AMOGUS_CAMROT = AMOGUS_VERTUV + 2, AMOGUS_TEX, AMOGUS_SETTINGS,
        AMOGUS_CAMDIRX = AMOGUS_CAMX, AMOGUS_CAMDIRY, AMOGUS_CAMDIRZ,
        AMOGUS_COSYAW = AMOGUS_VERTX, AMOGUS_SINYAW,
        AMOGUS_DRAWTOSCREEN = AMOGUS_SETTINGS + 2,
        AMOGUS_SUBMITVERT, AMOGUS_DRAWQUAD, AMOGUS_CLEARBUFFER,
        //screen
        SCREEN_NOP,
        SCREEN_X1, SCREEN_Y1, SCREEN_X2, SCREEN_Y2,
        SCREEN_DRAWRECT,
        SCREEN_X1_DRAWRECT, SCREEN_Y1_DRAWRECT, SCREEN_X2_DRAWRECT, SCREEN_Y2_DRAWRECT,
        SCREEN_CLEARRECT,
        SCREEN_X1_CLEARRECT, SCREEN_Y1_CLEARRECT, SCREEN_X2_CLEARRECT, SCREEN_Y2_CLEARRECT,
        SCREEN_DRAWTEX,
        SCREEN_X1_DRAWTEX, SCREEN_Y1_DRAWTEX,
        SCREEN_DRAWINVTEX,
        SCREEN_X1_DRAWINVTEX, SCREEN_Y1_DRAWINVTEX,
        SCREEN_TEXID,
        SCREEN_TEXID_DRAWTEX, SCREEN_TEXID_DRAWINVTEX,
        SCREEN_CLEARSCREEN, SCREEN_BUFFER,

    
    GAMEPAD = IO_Port.UD16, AXIS = IO_Port.UD15, KEY = IO_Port.UD14,
}

export interface Instruction_Ctx {
    readonly bits: number,
    readonly max_value: number,
    readonly max_signed: number,
    readonly sign_bit: number,
    pc: number;
    a: number,
    b: number,
    c: number,
    sa: number,
    sb: number,
    sc: number,
    m_set(a: number, v: number): void;
    m_get(a: number): number;
    push(a: number): void;
    pop(): number;
    in(port: number): boolean;
    out(port: number, value: number): void;
}

type Instruction_Callback = (ctx: Instruction_Ctx) => void | boolean;

const {SET, GET, GET_RAM: GAM, SET_RAM: SAM, RAM_OFFSET: RAO} = Operant_Operation;
export const Opcodes_operants: Record<Opcode, [Operant_Operation[], Instruction_Callback]> = {
    //----- Core Instructions
    // Add Op2 to Op3 then put result into Op1
    [Opcode.ADD ]: [[SET, GET, GET], (s) => {s.a = s.b + s.c}],
    // Unsigned right shift Op2 once then put result into Op1
    [Opcode.RSH ]: [[SET, GET     ], (s) => {s.a = s.b >>> 1}],
    // Copy RAM value pointed to by Op2 into Op1
    [Opcode.LOD ]: [[SET, GAM     ], (s) => {s.a = s.m_get(s.b)}],
    // Copy Op2 into RAM value pointed to by Op1
    [Opcode.STR ]: [[SAM, GET     ], (s) => s.m_set(s.a, s.b)],
    // Branch to address specified by Op1 if Op2 is more than or equal to Op3
    [Opcode.BGE ]: [[GET, GET, GET], (s) => {if (s.b >= s.c) s.pc = s.a}],
    [Opcode.SBGE ]: [[GET, GET, GET], (s) => {if (s.sb >= s.sc) s.pc = s.a}],
    // Bitwise NOR Op2 and Op3 then put result into Op1
    [Opcode.NOR ]: [[SET, GET, GET], (s) => {s.a = ~(s.b | s.c)}],
    // Load immediate
    [Opcode.IMM ]: [[SET, GET     ], (s) => {s.a = s.b}],
    
    //----- Basic Instructions
    // Subtract Op3 from Op2 then put result into Op1
    [Opcode.SUB ]: [[SET, GET, GET], (s) => {s.a = s.b - s.c}],
    // Branch to address specified by Op1
    [Opcode.JMP ]: [[GET          ], (s) => {s.pc = s.a}],
    // Copy Op2 to Op1
    [Opcode.MOV ]: [[SET, GET     ], (s) => {s.a = s.b}],
    // Copy Op2 to Op1
    [Opcode.NOP ]: [[             ], ()=> false],
    // Left shift Op2 once then put result into Op1
    [Opcode.LSH ]: [[SET, GET     ], (s) => {s.a = s.b << 1}],
    // Add 1 to Op2 then put result into Op1
    [Opcode.INC ]: [[SET, GET     ], (s) => {s.a = s.b + 1}],
    // Subtract 1 from Op2 then put result into Op1
    [Opcode.DEC ]: [[SET, GET     ], (s) => {s.a = s.b - 1}],
    // Calculates the 2s complement of Op2 then puts answer into Op1
    [Opcode.NEG ]: [[SET, GET     ], (s) => {s.a = -s.b}],
    // Bitwise AND Op2 and Op3 then put result into Op1
    [Opcode.AND ]: [[SET, GET, GET], (s) => {s.a = s.b & s.c}],
    // Bitwise OR Op2 and Op3 then put result into Op1
    [Opcode.OR  ]: [[SET, GET, GET], (s) => {s.a = s.b | s.c}],
    // Bitwise NOT of Op2 then put result into Op1
    [Opcode.NOT ]: [[SET, GET     ], (s) => {s.a = ~s.b}],
    // Bitwise XNOR Op2 and Op3 then put result into Op1
    [Opcode.XNOR]: [[SET, GET, GET], (s) => {s.a = ~(s.b ^ s.c)}],
    // Bitwise XOR Op2 and Op3 then put result into Op1
    [Opcode.XOR ]: [[SET, GET, GET], (s) => {s.a = s.b ^ s.c}],
    // Bitwise NAND Op2 and Op3 then put result into Op1
    [Opcode.NAND]: [[SET, GET, GET], (s) => {s.a = ~(s.b & s.c)}],
    // Branch to address specified by Op1 if Op2 is less than Op3
    [Opcode.BRL ]: [[GET, GET, GET], (s) => {if (s.b < s.c) s.pc = s.a}],
    [Opcode.SBRL ]: [[GET, GET, GET], (s) => {if (s.sb < s.sc) s.pc = s.a}],
    // Branch to address specified by Op1 if Op2 is more than Op3
    [Opcode.BRG ]: [[GET, GET, GET], (s) => {if (s.b > s.c) s.pc = s.a}],
    [Opcode.SBRG ]: [[GET, GET, GET], (s) => {if (s.sb > s.sc) s.pc = s.sa}],
    // Branch to address specified by Op1 if Op2 is equal to Op3
    [Opcode.BRE ]: [[GET, GET, GET], (s) => {if (s.b === s.c) s.pc = s.a}],
    // Branch to address specified by Op1 if Op2 is not equal to Op3
    [Opcode.BNE ]: [[GET, GET, GET], (s) => {if (s.b !== s.c) s.pc = s.a}],
    // Branch to address specified by Op1 if Op2 is Odd (AKA the lowest bit is active)
    [Opcode.BOD ]: [[GET, GET     ], (s) => {if (s.b & 1) s.pc = s.a}],
    // Branch to address specified by Op1 if Op2 is Even (AKA the lowest bit is not active)
    [Opcode.BEV ]: [[GET, GET     ], (s) => {if (!(s.b & 1)) s.pc = s.a}],
    // Branch to address specified by Op1 if Op2 is less than or equal to Op3
    [Opcode.BLE ]: [[GET, GET, GET], (s) => {if (s.b <= s.c) s.pc = s.a}],
    [Opcode.SBLE ]: [[GET, GET, GET], (s) => {if (s.sb <= s.sc) s.pc = s.a}],
    // Branch to address specified by Op1 if Op2 equal to 0
    [Opcode.BRZ ]: [[GET, GET     ], (s) => {if (s.b === 0) s.pc = s.a}],
    // Branch to address specified by Op1 if Op2 is not equal to 0
    [Opcode.BNZ ]: [[GET, GET     ], (s) => {if (s.b !== 0) s.pc = s.a}],
    // Branch to address specified by Op1 if the result of the previous instruction is negative (AKA the upper most bit is active)
    [Opcode.BRN ]: [[GET, GET     ], (s) => {if (s.b & s.sign_bit) s.pc = s.a}],
    // Branch to address specified by Op1 if the result of the previous instruction is positive (AKA the upper most bit is not active)
    [Opcode.BRP ]: [[GET, GET     ], (s) => {if (!(s.b & s.sign_bit)) s.pc = s.a}],
    // Push Op1 onto the value stack
    [Opcode.PSH ]: [[GET          ], (s) => {s.push(s.a)}],
    // Pop from the value stack into Op1
    [Opcode.POP ]: [[SET          ], (s) => {s.a = s.pop()}],
    // Pushes the address of the next instruction onto the stack then branches to Op1
    [Opcode.CAL ]: [[GET          ], (s) => {s.push(s.pc); s.pc = s.a}],
    // Pops from the stack, then branches to that value
    [Opcode.RET ]: [[             ], (s) => {s.pc = s.pop()}],
    // Stop Execution emediately after opcode is read
    [Opcode.HLT ]: [[             ],() => true],
    // Copies the value located at the RAM location pointed to by Op2 into the RAM position pointed to by Op1.
    [Opcode.CPY ]: [[SAM, GAM     ], (s) => s.m_set(s.a, s.m_get(s.b))],
    // Branch to Op1 if Op2 + Op3 gives a carry out
    [Opcode.BRC ]: [[GET, GET, GET], (s) => {if (s.b + s.c > s.max_value) s.pc = s.a}],
    // Branch to Op1 if Op2 + Op3 does not give a carry out
    [Opcode.BNC ]: [[GET, GET, GET], (s) => {if (s.b + s.c <= s.max_value) s.pc = s.a}],

    //----- Complex Instructions
    // Multiply Op2 by Op3 then put the lower half of the answer into Op1
    [Opcode.MLT  ]: [[SET, GET, GET], (s) => {s.a = s.b * s.c}],
    // Unsigned division of Op2 by Op3 then put answer into Op1
    [Opcode.DIV  ]: [[SET, GET, GET], (s) => {s.a = s.b / s.c}],
    [Opcode.SDIV  ]: [[SET, GET, GET], (s) => {s.a = s.sb / s.sc}],
    // Unsigned modulus of Op2 by Op3 then put answer into Op1
    [Opcode.MOD  ]: [[SET, GET, GET], (s) => {s.a = s.b % s.c}],
    // Right shift Op2, Op3 times then put result into Op1
    [Opcode.BSR  ]: [[SET, GET, GET], (s) => {s.a = s.b >>> s.c}],
    // Left shift Op2, Op3 times then put result into Op1
    [Opcode.BSL  ]: [[SET, GET, GET], (s) => {s.a = s.b << s.c}],
    // Signed right shift Op2 once then put result into Op1
    [Opcode.SRS  ]: [[SET, GET     ], (s) => {s.a = s.sb >> 1}],
    // Signed right shift Op2, Op3 times then put result into Op1
    [Opcode.BSS  ]: [[SET, GET, GET], (s) => {s.a = s.sb >> s.c}],
    // If Op2 equals Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETE ]: [[SET, GET, GET], (s) => {s.a = s.b === s.c ? s.max_value : 0}],
    // If Op2 is not equal to Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETNE]: [[SET, GET, GET], (s) => {s.a = s.b !== s.c ? s.max_value : 0}],
    // If Op2 if more than Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETG ]: [[SET, GET, GET], (s) => {s.a = s.b > s.c ? s.max_value : 0}],
    [Opcode.SSETG ]: [[SET, GET, GET], (s) => {s.a = s.sb > s.sc ? s.max_value : 0}],
    // If Op2 if less than Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETL ]: [[SET, GET, GET], (s) => {s.a = s.b < s.c ? s.max_value : 0}],
    [Opcode.SSETL ]: [[SET, GET, GET], (s) => {s.a = s.sb < s.sc ? s.max_value : 0}],
    // If Op2 if greater than or equal to Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETGE]: [[SET, GET, GET], (s) => {s.a = s.b >= s.c ? s.max_value : 0}],
    [Opcode.SSETGE]: [[SET, GET, GET], (s) => {s.a = s.sb >= s.sc ? s.max_value : 0}],
    // If Op2 if less than or equal to Op3 then set Op1 to all ones in binary else set Op1 to 0
    [Opcode.SETLE]: [[SET, GET, GET], (s) => {s.a = s.b <= s.c ? s.max_value : 0}],
    [Opcode.SSETLE]: [[SET, GET, GET], (s) => {s.a = s.sb <= s.sc ? s.max_value : 0}],
    // If Op2 + Op3 produces a carry out then set Op1 to all ones in binary, else set Op1 to 0
    [Opcode.SETC ]: [[SET, GET, GET], (s) => {s.a = s.b + s.c > s.max_value ? s.max_value : 0}],
    // If Op2 + Op3 does not produce a carry out then set Op1 to all ones in binary, else set Op1 to 0
    [Opcode.SETNC]: [[SET, GET, GET], (s) => {s.a = s.b + s.c <= s.max_value ? s.max_value : 0}],
    // Copy RAM value pointed to by (Op2 + Op3) into Op1. Where Op2 is the base pointer is Op3 is the offset.
    [Opcode.LLOD ]: [[SET, RAO, GAM], (s) => {s.a = s.m_get(s.b + s.c)}],
    // Copy Op3 into RAM value pointed to by (Op1 + Op2). Where Op1 is the base pointer is Op2 is the offset.
    [Opcode.LSTR ]: [[RAO, SAM, GET], (s) => s.m_set(s.a + s.b, s.c)],

    //----- IO Instructions
    [Opcode.IN  ]: [[SET, GET], (s) => s.in(s.b)],
    [Opcode.OUT ]: [[GET, GET], (s) => {s.out(s.a, s.b)}],

    //----- Assert Instructions
    [Opcode.__ASSERT]: [[GET], (s) => {if (!s.a) fail_assert(s) }],
    [Opcode.__ASSERT0]: [[GET], (s) => {if (s.a) fail_assert(s) }],
    [Opcode.__ASSERT_EQ]: [[GET, GET], (s) => {if (s.a !== s.b) fail_assert(s)}],
    [Opcode.__ASSERT_NEQ]: [[GET, GET], (s) => {if (s.a === s.b) fail_assert(s)}],

    //----- Custom CHUNGUS Instructions
    [Opcode.UMLT ]: [[SET, GET, GET], (s) => { s.a = (s.b * s.c) >> s.bits }],
    [Opcode.ADDV ]: [[SET, GET, GET], (s) => { s.a = (((s.b & 0xf0) + (s.c & 0xf0)) & 0xf0) | (((s.b & 0x0f) + (s.c & 0x0f)) & 0x0f) }],
    [Opcode.SUBV ]: [[SET, GET, GET], (s) => { s.a = (((s.b & 0xf0) - (s.c & 0xf0)) & 0xf0) | (((s.b & 0x0f) - (s.c & 0x0f)) & 0x0f) }],
    [Opcode.SQRT ]: [[SET, GET     ], (s) => { s.a = Math.sqrt(s.b) }],
    [Opcode.CLZ  ]: [[SET, GET     ], (s) => { s.a = Math.clz32(s.b) - 24 }],
    [Opcode.CTZ  ]: [[SET, GET     ], (s) => {
        let trailingZeros = 32;
        let num = s.b & -s.b;
        if (num) trailingZeros--;
        if (num & 0x0000FFFF) trailingZeros -= 16;
        if (num & 0x00FF00FF) trailingZeros -= 8;
        if (num & 0x0F0F0F0F) trailingZeros -= 4;
        if (num & 0x33333333) trailingZeros -= 2;
        if (num & 0x55555555) trailingZeros -= 1;
        s.a = trailingZeros;
    }],
    [Opcode.BTC  ]: [[SET, GET     ], (s) => {
        let num = s.b - ((s.b >> 1) & 0x55555555);
        num = (num & 0x33333333) + ((num >> 2) & 0x33333333);
        s.a = (( num + (num >> 4) & 0x0f0f0f0f) * 0x01010101) >> 24;
    }]
};

export const inst_fns: Record<Opcode, Instruction_Callback> 
    = object_map(Opcodes_operants, (key, value)=>{
        if (value === undefined){throw new Error("instruction definition undefined");}
        return [key, value?.[1]];
    }, []);

export const Opcodes_operant_lengths: Record<Opcode, number> 
    = object_map(Opcodes_operants, (key, value) => {
        if (value === undefined){throw new Error("instruction definition undefined");}
        return [key, value[0].length];
    }, []);


function fail_assert(ctx: {out(port: number, value: number):void, pc: number}){
    const message = `Assertion failed at pc=${ctx.pc}\n`;
    for (let i = 0; i < message.length; i++){
        ctx.out(IO_Port.TEXT, message.charCodeAt(i));
    }
}
