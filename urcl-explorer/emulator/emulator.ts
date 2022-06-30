import { Word, registers_to_string, indent, hex, pad_center, pad_left } from "./util.js";
import {Opcode, Operant_Operation, Operant_Prim, Opcodes_operants, Instruction_Ctx, URCL_Header, IO_Port, Register, Header_Run, register_count, inst_fns, Opcodes_operant_lengths} from "./instructions.js";
import { Debug_Info, Program } from "./compiler.js";
import { Device, Device_Host, Device_Input, Device_Output, Device_Reset } from "./devices/device.js";
import { Break } from "./breaks.js"; 

export enum Step_Result {
    Continue, Halt, Input, Debug
}
type WordArray = Uint8Array | Uint16Array | Uint32Array;

interface Emu_Options {
    error?: (a: string) => never;
    warn?: (a: string) => void;
    on_continue?: ()=>void;
    max_memory?: ()=>number;
}

export class Emulator implements Instruction_Ctx, Device_Host {
    private signed(v: number){
        return (v & this.sign_bit) === 0 ? v : v | (0xffff_ffff << this.bits);
    }
    a = 0;
    b = 0;
    c = 0;
    get sa(){return this.signed(this.a);}
    set sa(v: number){this.a = v;}

    get sb(){return this.signed(this.b);}
    set sb(v: number){this.b = v;}

    get sc(){return this.signed(this.c);}
    set sc(v: number){this.c = v;}

    public program!: Program;
    public debug_info!: Debug_Info;
    private _debug_message: undefined | string = undefined;

    public get_debug_message(){
        const msg = this._debug_message;
        this._debug_message = undefined;
        return msg;
    }

    constructor(public options: Emu_Options){

    }
    private heap_size = 0;
    load_program(program: Program, debug_info: Debug_Info){
        this._debug_message = undefined;
        this.program = program, this.debug_info = debug_info;
        this.pc_counters = Array.from({length: program.opcodes.length}, () => 0);
        const bits = program.headers[URCL_Header.BITS].value;
        const static_data = program.data;
        const heap = program.headers[URCL_Header.MINHEAP].value;
        const stack = program.headers[URCL_Header.MINSTACK].value;
        const registers = program.headers[URCL_Header.MINREG].value + register_count;
        const run = program.headers[URCL_Header.RUN].value;
        this.heap_size = heap;
        if (run === Header_Run.RAM){
            throw new Error("emulator currently doesn't support running in ram");
        }
        let WordArray;
        if (bits <= 8){
            WordArray = Uint8Array;
            this.bits = 8;
        } else if (bits <= 16){
            WordArray = Uint16Array;
            this.bits = 16;
        } else if (bits <= 32){
            WordArray = Uint32Array;
            this.bits = 32;
        } else {
            throw new Error(`BITS = ${bits} exceeds 32 bits`);
        }
        if (registers > this.max_size){
            throw new Error(`Too many registers ${registers}, must be <= ${this.max_size}`)
        }
        const memory_size = heap + stack + static_data.length
        if (memory_size > this.max_size){
            throw new Error(`Too much memory heap:${heap} + stack:${stack} + dws:${static_data.length} = ${memory_size}, must be <= ${this.max_size}`);
        }
        const buffer_size = (memory_size + registers) * WordArray.BYTES_PER_ELEMENT;
        if (this.buffer.byteLength < buffer_size){
            this.warn(`resizing Arraybuffer to ${buffer_size} bytes`);
            const max_size = this.options.max_memory?.();
            if (max_size && buffer_size > max_size){
                throw new Error(`Unable to allocate memory for the emulator because\t\n${buffer_size} bytes exceeds the maximum of ${max_size}bytes`);
            }
            try {
                this.buffer = new ArrayBuffer(buffer_size);
            } catch (e){
                throw new Error(`Unable to allocate enough memory for the emulator because:\n\t${e}`);
            }
        }

        this.registers = new WordArray(this.buffer, 0, registers).fill(0);
        this.memory = new WordArray(this.buffer, registers * WordArray.BYTES_PER_ELEMENT, memory_size).fill(0);

        for (let i = 0; i < static_data.length; i++){
            this.memory[i] = static_data[i];
        }

        this.reset();
        for (const device of this.devices){
            device.bits = bits;
        }
    }
    reset(){
        this.stack_ptr = this.memory.length;
        this.pc = 0;
        this.callStackPointer = 0; //CHUNGUS
        this.ins = []; this.outs = [];
        for (const reset of this.device_resets){
            reset();
        }
    }
    shrink_buffer(){
        this.buffer = new ArrayBuffer(1024*1024);
    }
    buffer = new ArrayBuffer(1024*1024);
    registers: WordArray = new Uint8Array(32);
    memory: WordArray = new Uint8Array(256);
    callStack: WordArray = new Uint32Array(31); //CHUNGUS
    callStackPointer: number = 0; //CHUNGUS
    pc_counters: number[] = [];
    pc_full = 0; //CHUNGUS
    get pc(){
        return this.pc_full; //CHUNGUS
    }
    set pc(value: Word){
        this.registers[Register.PC] = value;
        this.pc_full = value; //CHUNGUS
    }
    get stack_ptr(){
        return this.registers[Register.SP];
    }
    set stack_ptr(value: Word){
        this.registers[Register.SP] = value;
    }
    bits = 8;
    private device_inputs: {[K in IO_Port]?: Device_Input} = {};
    private device_outputs: {[K in IO_Port]?: Device_Output} = {};
    private device_resets: Device_Reset[] = [];
    private devices: Device[] = []
    public add_io_device(device: Device){
        this.devices.push(device);
        if (device.inputs){
            for (const port in device.inputs){
                const input = device.inputs[port as any as IO_Port] as Device_Input;
                this.device_inputs[port as any as IO_Port] = input.bind(device);
            }
        }
        if (device.outputs){
            for (const port in device.outputs){
                const output = device.outputs[port as any as IO_Port] as Device_Output;
                this.device_outputs[port as any as IO_Port] = output.bind(device);
            }
        }
        if (device.reset){
            this.device_resets.push(device.reset.bind(device));
        }
    }
    

    get max_value(){
        return 0xff_ff_ff_ff >>> (32 - this.bits);
    }
    get max_size(){
        return this.max_value + 1;
    }
    get max_signed(){
        return (1 << (this.bits-1)) - 1;
    }
    get sign_bit(){
        return (1 << (this.bits-1));
    }
    push(value: Word): void {
        if (this.stack_ptr <= this.heap_size){
            this.error(`Stack overflow: ${this.stack_ptr} <= ${this.heap_size}}`);
        }
        this.memory[--this.stack_ptr] = value;
    }
    pop(): Word { 
        if (this.stack_ptr >= this.memory.length){
            this.error(`Stack underflow: ${this.stack_ptr} >= ${this.memory.length}`);
        }
        return this.memory[this.stack_ptr++];
    }
    callStack_push(value: number): void { //CHUNGUS
        if (this.callStackPointer >= this.callStack.length) {
            this.error(`Call stack overflow: ${this.callStackPointer} >= ${this.callStack.length}`);
        }
        this.callStack[this.callStackPointer++] = value;
    }
    callStack_pop(): number { //CHUNGUS
        if (this.callStackPointer <= 0) {
            this.error(`Call stack underflow: ${this.callStackPointer} <= 0`);
        }
        return this.callStack[--this.callStackPointer];
    }
    ins: number[] = [];
    outs: number[] = [];
    in(port: Word): boolean {
    try {
        const device = this.device_inputs[port as IO_Port];
        if (device === undefined){
            if (this.ins[port] === undefined){
                this.warn(`unsupported input device port ${port} (${IO_Port[port]})`);
            }
            this.ins[port] = 1;
            return false;
        }
        if (this.debug_info.port_breaks[port] & Break.ONREAD){
            this.debug(`Reading from Port ${port} (${IO_Port[port]})`);
        }

        const res = device(this.finish_step_in.bind(this, port));
        if (res === undefined){
            if (this.debug_info.port_breaks[port] & Break.ONREAD){
                this.debug(`Read from port ${port} (${IO_Port[port]}) value=${res}`);
            }
            this.pc--;
            return true;
        } else {
            this.a = res as number;
            if (this.debug_info.port_breaks[port] & Break.ONREAD){
                this.debug(`Read from port ${port} (${IO_Port[port]}) value=${res}`);
            }
            return false;
        }
    } catch (e){
        this.error(""+e);
    }
    }
    out(port: Word, value: Word): void{
    try {
        const device = this.device_outputs[port as IO_Port];
        if (device === undefined){
            if (this.outs[port] === undefined){
                this.warn(`unsupported output device port ${port} (${IO_Port[port]}) value=${value}`);
                this.outs[port] = value
            }
            return;
        }
        if (this.debug_info.port_breaks[port] & Break.ONWRITE){
            let char_str = "";
            try {
                const char = JSON.stringify(String.fromCodePoint(value));
                char_str = `'${char.substring(1, char.length-1)}'`;
            } catch {}
            this.debug(`Written to port ${port} (${IO_Port[port]}) value=${value} ${char_str}`);
        }
        device(value);
    } catch (e){
        this.error(""+e);
    }
    }
    burst(length: number, max_duration: number): [Step_Result, number]{
        const start_length = length;
        const burst_length = 1024;
        const end = performance.now() + max_duration;
        
        for (;length >= burst_length; length -= burst_length) {
            for (let i = 0; i < burst_length; i++){
                const res = this.step();
                if (res !== Step_Result.Continue){
                    return [res, start_length - length + i + 1];
                }
            }
            
            if (performance.now() > end){
                return [Step_Result.Continue, start_length - length + burst_length]
            }
        }
        for (let i = 0; i < length; i++){
            const res = this.step();
            if (res !== Step_Result.Continue){
                return [res, start_length - length + i + 1];
            }
        }
        return [Step_Result.Continue, start_length];
    }
    run(max_duration: number): [Step_Result, number] {
        const burst_length = 1024;
        const end = performance.now() + max_duration;
        let j = 0;
        do {
            for (let i = 0; i < burst_length; i++){
                const res = this.step();
                if (res !== Step_Result.Continue){
                    return [res, j + i + 1];
                }
            }
            j += burst_length;
        } while (performance.now() < end);
        return [Step_Result.Continue, j];
    }
step(): Step_Result {
    const pc = this.pc++;
    if (this.debug_info.program_breaks[pc]){
        this.debug(`Reached @DEBUG Before:`);
        return Step_Result.Debug;
    }
    if (pc >= this.program.opcodes.length){return Step_Result.Halt;}
    this.pc_counters[pc]++;
    const opcode = this.program.opcodes[pc];
    if (opcode === Opcode.HLT){
        this.pc--;
        return Step_Result.Halt;
    }
    const [[op], func] = Opcodes_operants[opcode];
    if (func === undefined){this.error(`unkown opcode ${opcode}`);}

    const op_types = this.program.operant_prims[pc];
    const op_values = this.program.operant_values[pc];
    const length = op_values.length;
    if (length >= 1 && op !== Operant_Operation.SET)this.a = this.read(op_types[0], op_values[0]);
    if (length >= 2)this.b = this.read(op_types[1], op_values[1]);
    if (length >= 3)this.c = this.read(op_types[2], op_values[2]);
    if (func(this)) {
        return Step_Result.Input;
    }
    if (length >= 1 && op === Operant_Operation.SET)this.write(op_types[0], op_values[0], this.a);

    if (this._debug_message !== undefined){
        return Step_Result.Debug;
    }

    return Step_Result.Continue;
}

    m_set(addr: number, value: number){
        if (addr >= this.memory.length){
            this.error(`Heap overflow on store: ${addr} >= ${this.memory.length}`);
        }
        if (this.debug_info.memory_breaks[addr] & Break.ONWRITE){
            this.debug(`Written memory[${addr}] which was ${this.memory[addr]} to ${value}`);

        }
        this.memory[addr] = value;
    }
    m_get(addr: number){
        if (addr >= this.memory.length){
            this.error(`Heap overflow on load: #${addr} >= ${this.memory.length}`);
        }
        if (this.debug_info.memory_breaks[addr] & Break.ONREAD){
            this.debug(`Read memory[${addr}] = ${this.memory[addr]}`);
        }
        return this.memory[addr];
    }
    // this method only needs to be called for the IN instruction
    finish_step_in(port: number, result: Word){
        const pc = this.pc++;
        const type = this.program.operant_prims[pc][0];
        const value = this.program.operant_values[pc][0];
        this.write(type, value, result);
        this.options.on_continue?.();
    }
    write(target: Operant_Prim, index: Word, value: Word){
        switch (target){
            case Operant_Prim.Reg: {
                if (this.debug_info.register_breaks[index] & Break.ONWRITE){
                    this.debug(`Written r${index - register_count + 1} which was ${this.registers[index]} to ${value}`);
                }
                this.registers[index] = value;
            } return;
            case Operant_Prim.Imm: return; // do nothing
            default: this.error(`Unknown operant target ${target}`);
        }
    }
    read(source: Operant_Prim, index: Word){
        switch (source){
            case Operant_Prim.Imm: return index;
            case Operant_Prim.Reg: {
                if (this.debug_info.register_breaks[index] & Break.ONREAD){
                    this.debug(`Read r${index - register_count + 1} = ${this.registers[index]}`);
                }
                return this.registers[index];
            }
            default: this.error(`Unknown operant source ${source}`); 
        }
    }
    error(msg: string): never {
        const {pc_line_nrs, lines, file_name} = this.debug_info;
        const line_nr = pc_line_nrs[this.pc-1];
        const trace = this.decode_memory(this.stack_ptr, this.memory.length, false);
        const content = `${file_name??"eval"}:${line_nr + 1} - ERROR - ${msg}\n    ${lines[line_nr]}\n\n${indent(registers_to_string(this), 1)}\n\nstack trace:\n${trace}`;
        if (this.options.error){
            this.options.error(content)
        }
        throw Error(content);
    }
    get_line_nr(pc = this.pc): number {
        return this.debug_info.pc_line_nrs[pc-1] || -2;
    }
    get_line(pc = this.pc): string {
        const line = this.debug_info.lines[this.get_line_nr(pc)];
        if (line == undefined){return "";}
        return `\n\t${line}`;
    }
    format_message(msg: string, pc = this.pc): string {
        const {lines, file_name} = this.debug_info;
        const line_nr = this.get_line_nr(pc)
        return `${file_name??"eval"}:${line_nr + 1} - ${msg}\n\t${lines[line_nr] ?? ""}`;
    }

    warn(msg: string): void {
        const content =  this.format_message(`warning - ${msg}`);
        if (this.options.warn){
            this.options.warn(content);
        } else {
            console.warn(content);
        }
    }
    debug(msg: string): void {
        this._debug_message = (this._debug_message ?? "") + this.format_message(`debug - ${msg}`) + "\n";  
    }

    decode_memory(start: number, end: number, reverse: boolean): string {
        const w = 8;
        const headers = ["hexaddr", "hexval", "value", "*value", "linenr", "*opcode"]
        let str = headers.map(v => pad_center(v, w)).join("|");
        let view = this.memory.slice(start, end);
        if (reverse){
            view = view.reverse();
        }
        for (const [i, v] of view.entries()){
            const j = reverse ? end - i : start+i;
            const index = hex(j, w, " ");
            const h = hex(v, w, " ");
            const value = pad_left(""+v, w);
            const opcode = pad_left(Opcode[this.program.opcodes[v]] ?? ".", w);
            const linenr = pad_left(""+(this.debug_info.pc_line_nrs[v] ?? "."), w)
            const mem = pad_left(""+(this.memory[v] ?? "."), w);
            str += `\n${index}|${h}|${value}|${mem}|${linenr}|${opcode}`
        }
        return str
    }
}
