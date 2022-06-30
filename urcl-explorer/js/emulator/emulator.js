import { registers_to_string, indent, hex, pad_center, pad_left } from "./util.js";
import { Opcode, Operant_Operation, Operant_Prim, Opcodes_operants, URCL_Header, IO_Port, Register, Header_Run, register_count } from "./instructions.js";
import { Break } from "./breaks.js";
export var Step_Result;
(function (Step_Result) {
    Step_Result[Step_Result["Continue"] = 0] = "Continue";
    Step_Result[Step_Result["Halt"] = 1] = "Halt";
    Step_Result[Step_Result["Input"] = 2] = "Input";
    Step_Result[Step_Result["Debug"] = 3] = "Debug";
})(Step_Result || (Step_Result = {}));
export class Emulator {
    constructor(options) {
        this.options = options;
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this._debug_message = undefined;
        this.heap_size = 0;
        this.buffer = new ArrayBuffer(1024 * 1024);
        this.registers = new Uint8Array(32);
        this.memory = new Uint8Array(256);
        this.callStack = new Uint32Array(31); //CHUNGUS
        this.callStackPointer = 0; //CHUNGUS
        this.pc_counters = [];
        this.pc_full = 0; //CHUNGUS
        this.bits = 8;
        this.device_inputs = {};
        this.device_outputs = {};
        this.device_resets = [];
        this.devices = [];
        this.ins = [];
        this.outs = [];
    }
    signed(v) {
        return (v & this.sign_bit) === 0 ? v : v | (4294967295 << this.bits);
    }
    get sa() { return this.signed(this.a); }
    set sa(v) { this.a = v; }
    get sb() { return this.signed(this.b); }
    set sb(v) { this.b = v; }
    get sc() { return this.signed(this.c); }
    set sc(v) { this.c = v; }
    get_debug_message() {
        const msg = this._debug_message;
        this._debug_message = undefined;
        return msg;
    }
    load_program(program, debug_info) {
        var _a, _b;
        this._debug_message = undefined;
        this.program = program, this.debug_info = debug_info;
        this.pc_counters = Array.from({ length: program.opcodes.length }, () => 0);
        const bits = program.headers[URCL_Header.BITS].value;
        const static_data = program.data;
        const heap = program.headers[URCL_Header.MINHEAP].value;
        const stack = program.headers[URCL_Header.MINSTACK].value;
        const registers = program.headers[URCL_Header.MINREG].value + register_count;
        const run = program.headers[URCL_Header.RUN].value;
        this.heap_size = heap;
        if (run === Header_Run.RAM) {
            throw new Error("emulator currently doesn't support running in ram");
        }
        let WordArray;
        if (bits <= 8) {
            WordArray = Uint8Array;
            this.bits = 8;
        }
        else if (bits <= 16) {
            WordArray = Uint16Array;
            this.bits = 16;
        }
        else if (bits <= 32) {
            WordArray = Uint32Array;
            this.bits = 32;
        }
        else {
            throw new Error(`BITS = ${bits} exceeds 32 bits`);
        }
        if (registers > this.max_size) {
            throw new Error(`Too many registers ${registers}, must be <= ${this.max_size}`);
        }
        const memory_size = heap + stack + static_data.length;
        if (memory_size > this.max_size) {
            throw new Error(`Too much memory heap:${heap} + stack:${stack} + dws:${static_data.length} = ${memory_size}, must be <= ${this.max_size}`);
        }
        const buffer_size = (memory_size + registers) * WordArray.BYTES_PER_ELEMENT;
        if (this.buffer.byteLength < buffer_size) {
            this.warn(`resizing Arraybuffer to ${buffer_size} bytes`);
            const max_size = (_b = (_a = this.options).max_memory) === null || _b === void 0 ? void 0 : _b.call(_a);
            if (max_size && buffer_size > max_size) {
                throw new Error(`Unable to allocate memory for the emulator because\t\n${buffer_size} bytes exceeds the maximum of ${max_size}bytes`);
            }
            try {
                this.buffer = new ArrayBuffer(buffer_size);
            }
            catch (e) {
                throw new Error(`Unable to allocate enough memory for the emulator because:\n\t${e}`);
            }
        }
        this.registers = new WordArray(this.buffer, 0, registers).fill(0);
        this.memory = new WordArray(this.buffer, registers * WordArray.BYTES_PER_ELEMENT, memory_size).fill(0);
        for (let i = 0; i < static_data.length; i++) {
            this.memory[i] = static_data[i];
        }
        this.reset();
        for (const device of this.devices) {
            device.bits = bits;
        }
    }
    reset() {
        this.stack_ptr = this.memory.length;
        this.pc = 0;
        this.callStackPointer = 0; //CHUNGUS
        this.ins = [];
        this.outs = [];
        for (const reset of this.device_resets) {
            reset();
        }
    }
    shrink_buffer() {
        this.buffer = new ArrayBuffer(1024 * 1024);
    }
    get pc() {
        return this.pc_full; //CHUNGUS
    }
    set pc(value) {
        this.registers[Register.PC] = value;
        this.pc_full = value; //CHUNGUS
    }
    get stack_ptr() {
        return this.registers[Register.SP];
    }
    set stack_ptr(value) {
        this.registers[Register.SP] = value;
    }
    add_io_device(device) {
        this.devices.push(device);
        if (device.inputs) {
            for (const port in device.inputs) {
                const input = device.inputs[port];
                this.device_inputs[port] = input.bind(device);
            }
        }
        if (device.outputs) {
            for (const port in device.outputs) {
                const output = device.outputs[port];
                this.device_outputs[port] = output.bind(device);
            }
        }
        if (device.reset) {
            this.device_resets.push(device.reset.bind(device));
        }
    }
    get max_value() {
        return 4294967295 >>> (32 - this.bits);
    }
    get max_size() {
        return this.max_value + 1;
    }
    get max_signed() {
        return (1 << (this.bits - 1)) - 1;
    }
    get sign_bit() {
        return (1 << (this.bits - 1));
    }
    push(value) {
        if (this.stack_ptr <= this.heap_size) {
            this.error(`Stack overflow: ${this.stack_ptr} <= ${this.heap_size}}`);
        }
        this.memory[--this.stack_ptr] = value;
    }
    pop() {
        if (this.stack_ptr >= this.memory.length) {
            this.error(`Stack underflow: ${this.stack_ptr} >= ${this.memory.length}`);
        }
        return this.memory[this.stack_ptr++];
    }
    callStack_push(value) {
        if (this.callStackPointer >= this.callStack.length) {
            this.error(`Call stack overflow: ${this.callStackPointer} >= ${this.callStack.length}`);
        }
        this.callStack[this.callStackPointer++] = value;
    }
    callStack_pop() {
        if (this.callStackPointer <= 0) {
            this.error(`Call stack underflow: ${this.callStackPointer} <= 0`);
        }
        return this.callStack[--this.callStackPointer];
    }
    in(port) {
        try {
            const device = this.device_inputs[port];
            if (device === undefined) {
                if (this.ins[port] === undefined) {
                    this.warn(`unsupported input device port ${port} (${IO_Port[port]})`);
                }
                this.ins[port] = 1;
                return false;
            }
            if (this.debug_info.port_breaks[port] & Break.ONREAD) {
                this.debug(`Reading from Port ${port} (${IO_Port[port]})`);
            }
            const res = device(this.finish_step_in.bind(this, port));
            if (res === undefined) {
                if (this.debug_info.port_breaks[port] & Break.ONREAD) {
                    this.debug(`Read from port ${port} (${IO_Port[port]}) value=${res}`);
                }
                this.pc--;
                return true;
            }
            else {
                this.a = res;
                if (this.debug_info.port_breaks[port] & Break.ONREAD) {
                    this.debug(`Read from port ${port} (${IO_Port[port]}) value=${res}`);
                }
                return false;
            }
        }
        catch (e) {
            this.error("" + e);
        }
    }
    out(port, value) {
        try {
            const device = this.device_outputs[port];
            if (device === undefined) {
                if (this.outs[port] === undefined) {
                    this.warn(`unsupported output device port ${port} (${IO_Port[port]}) value=${value}`);
                    this.outs[port] = value;
                }
                return;
            }
            if (this.debug_info.port_breaks[port] & Break.ONWRITE) {
                let char_str = "";
                try {
                    const char = JSON.stringify(String.fromCodePoint(value));
                    char_str = `'${char.substring(1, char.length - 1)}'`;
                }
                catch (_a) { }
                this.debug(`Written to port ${port} (${IO_Port[port]}) value=${value} ${char_str}`);
            }
            device(value);
        }
        catch (e) {
            this.error("" + e);
        }
    }
    burst(length, max_duration) {
        const start_length = length;
        const burst_length = 1024;
        const end = performance.now() + max_duration;
        for (; length >= burst_length; length -= burst_length) {
            for (let i = 0; i < burst_length; i++) {
                const res = this.step();
                if (res !== Step_Result.Continue) {
                    return [res, start_length - length + i + 1];
                }
            }
            if (performance.now() > end) {
                return [Step_Result.Continue, start_length - length + burst_length];
            }
        }
        for (let i = 0; i < length; i++) {
            const res = this.step();
            if (res !== Step_Result.Continue) {
                return [res, start_length - length + i + 1];
            }
        }
        return [Step_Result.Continue, start_length];
    }
    run(max_duration) {
        const burst_length = 1024;
        const end = performance.now() + max_duration;
        let j = 0;
        do {
            for (let i = 0; i < burst_length; i++) {
                const res = this.step();
                if (res !== Step_Result.Continue) {
                    return [res, j + i + 1];
                }
            }
            j += burst_length;
        } while (performance.now() < end);
        return [Step_Result.Continue, j];
    }
    step() {
        const pc = this.pc++;
        if (this.debug_info.program_breaks[pc]) {
            this.debug(`Reached @DEBUG Before:`);
            return Step_Result.Debug;
        }
        if (pc >= this.program.opcodes.length) {
            return Step_Result.Halt;
        }
        this.pc_counters[pc]++;
        const opcode = this.program.opcodes[pc];
        if (opcode === Opcode.HLT) {
            this.pc--;
            return Step_Result.Halt;
        }
        const [[op], func] = Opcodes_operants[opcode];
        if (func === undefined) {
            this.error(`unkown opcode ${opcode}`);
        }
        const op_types = this.program.operant_prims[pc];
        const op_values = this.program.operant_values[pc];
        const length = op_values.length;
        if (length >= 1 && op !== Operant_Operation.SET)
            this.a = this.read(op_types[0], op_values[0]);
        if (length >= 2)
            this.b = this.read(op_types[1], op_values[1]);
        if (length >= 3)
            this.c = this.read(op_types[2], op_values[2]);
        if (func(this)) {
            return Step_Result.Input;
        }
        if (length >= 1 && op === Operant_Operation.SET)
            this.write(op_types[0], op_values[0], this.a);
        if (this._debug_message !== undefined) {
            return Step_Result.Debug;
        }
        return Step_Result.Continue;
    }
    m_set(addr, value) {
        if (addr >= this.memory.length) {
            this.error(`Heap overflow on store: ${addr} >= ${this.memory.length}`);
        }
        if (this.debug_info.memory_breaks[addr] & Break.ONWRITE) {
            this.debug(`Written memory[${addr}] which was ${this.memory[addr]} to ${value}`);
        }
        this.memory[addr] = value;
    }
    m_get(addr) {
        if (addr >= this.memory.length) {
            this.error(`Heap overflow on load: #${addr} >= ${this.memory.length}`);
        }
        if (this.debug_info.memory_breaks[addr] & Break.ONREAD) {
            this.debug(`Read memory[${addr}] = ${this.memory[addr]}`);
        }
        return this.memory[addr];
    }
    // this method only needs to be called for the IN instruction
    finish_step_in(port, result) {
        var _a, _b;
        const pc = this.pc++;
        const type = this.program.operant_prims[pc][0];
        const value = this.program.operant_values[pc][0];
        this.write(type, value, result);
        (_b = (_a = this.options).on_continue) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    write(target, index, value) {
        switch (target) {
            case Operant_Prim.Reg:
                {
                    if (this.debug_info.register_breaks[index] & Break.ONWRITE) {
                        this.debug(`Written r${index - register_count + 1} which was ${this.registers[index]} to ${value}`);
                    }
                    this.registers[index] = value;
                }
                return;
            case Operant_Prim.Imm: return; // do nothing
            default: this.error(`Unknown operant target ${target}`);
        }
    }
    read(source, index) {
        switch (source) {
            case Operant_Prim.Imm: return index;
            case Operant_Prim.Reg: {
                if (this.debug_info.register_breaks[index] & Break.ONREAD) {
                    this.debug(`Read r${index - register_count + 1} = ${this.registers[index]}`);
                }
                return this.registers[index];
            }
            default: this.error(`Unknown operant source ${source}`);
        }
    }
    error(msg) {
        const { pc_line_nrs, lines, file_name } = this.debug_info;
        const line_nr = pc_line_nrs[this.pc - 1];
        const trace = this.decode_memory(this.stack_ptr, this.memory.length, false);
        const content = `${file_name !== null && file_name !== void 0 ? file_name : "eval"}:${line_nr + 1} - ERROR - ${msg}\n    ${lines[line_nr]}\n\n${indent(registers_to_string(this), 1)}\n\nstack trace:\n${trace}`;
        if (this.options.error) {
            this.options.error(content);
        }
        throw Error(content);
    }
    get_line_nr(pc = this.pc) {
        return this.debug_info.pc_line_nrs[pc - 1] || -2;
    }
    get_line(pc = this.pc) {
        const line = this.debug_info.lines[this.get_line_nr(pc)];
        if (line == undefined) {
            return "";
        }
        return `\n\t${line}`;
    }
    format_message(msg, pc = this.pc) {
        var _a;
        const { lines, file_name } = this.debug_info;
        const line_nr = this.get_line_nr(pc);
        return `${file_name !== null && file_name !== void 0 ? file_name : "eval"}:${line_nr + 1} - ${msg}\n\t${(_a = lines[line_nr]) !== null && _a !== void 0 ? _a : ""}`;
    }
    warn(msg) {
        const content = this.format_message(`warning - ${msg}`);
        if (this.options.warn) {
            this.options.warn(content);
        }
        else {
            console.warn(content);
        }
    }
    debug(msg) {
        var _a;
        this._debug_message = ((_a = this._debug_message) !== null && _a !== void 0 ? _a : "") + this.format_message(`debug - ${msg}`) + "\n";
    }
    decode_memory(start, end, reverse) {
        var _a, _b, _c;
        const w = 8;
        const headers = ["hexaddr", "hexval", "value", "*value", "linenr", "*opcode"];
        let str = headers.map(v => pad_center(v, w)).join("|");
        let view = this.memory.slice(start, end);
        if (reverse) {
            view = view.reverse();
        }
        for (const [i, v] of view.entries()) {
            const j = reverse ? end - i : start + i;
            const index = hex(j, w, " ");
            const h = hex(v, w, " ");
            const value = pad_left("" + v, w);
            const opcode = pad_left((_a = Opcode[this.program.opcodes[v]]) !== null && _a !== void 0 ? _a : ".", w);
            const linenr = pad_left("" + ((_b = this.debug_info.pc_line_nrs[v]) !== null && _b !== void 0 ? _b : "."), w);
            const mem = pad_left("" + ((_c = this.memory[v]) !== null && _c !== void 0 ? _c : "."), w);
            str += `\n${index}|${h}|${value}|${mem}|${linenr}|${opcode}`;
        }
        return str;
    }
}