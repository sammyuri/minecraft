import { Break, BreakFlag, break_flag } from "./breaks.js";
import { Constants, Header_Operant, IO_Port as IO_Port, Opcode, Opcodes_operant_lengths as Opcodes_operant_counts, Operant_Prim, Operant_Type, Register, register_count, URCL_Header, urcl_headers } from "./instructions.js";
import { enum_count, enum_from_str, enum_strings, f16_encode, f32_encode, i53, is_digit, warn, Warning, Word } from "./util.js";

function try_parse_int(x: string){
    const int = my_parse_int(x);
    return Number.isInteger(int) ? int : undefined;
}

function my_parse_int(x: string){
    x = x.replace(/\_/g, "");
    if (x.startsWith("0b")){
        return parseInt(x.slice(2), 2);
    }
    return parseInt(x);
}
function my_parse_float(x: string){
    x = x.replace(/\_/g, "");
    const float = parseFloat(x);
    if (isNaN(float)){
        return undefined;
    }
    return float;
}
function my_parse_f32(x: string){
    x = x.replace(/\_/g, "");
    const float = parseFloat(x);
    if (isNaN(float)){
        return undefined;
    }
    return f32_encode(float);
}

enum Label_Type {
    Inst, DW
}

interface Label {
    type: Label_Type, index: i53
}

interface Header_Value {
    value: number,
    line_nr?: number,
    operant?: Header_Operant,
}
export type Header_Obj = {[K in URCL_Header]: Header_Value};

export class Parser_output implements Label_Out, Instruction_Out {
    readonly errors: Warning[] = [];
    readonly warnings: Warning[] = [];
    readonly data: number[] = [];

    lines                      : string[] = [];
    readonly headers           : Header_Obj = {} as Header_Obj;
    readonly constants         : Record<string, string> = {};
    readonly labels            : Record<string, Label> = {};
    readonly instr_line_nrs    : i53[] = [];
    readonly opcodes           : Opcode[] = [];
    readonly operant_strings   : string[][] = [];
    readonly operant_types     : Operant_Type[][] = [];
    readonly operant_values    : i53[][] = [];

    readonly register_breaks   : Record<number, BreakFlag> = {};
    readonly data_breaks       : Record<number, BreakFlag> = {};
    readonly heap_breaks     : Record<number, BreakFlag> = {};
    readonly program_breaks    : Record<number, BreakFlag> = {};
    readonly port_breaks       : Record<IO_Port, BreakFlag> = {};
}
interface Label_Out {
    readonly labels            : Record<string, Label>;
}
interface Instruction_Out {
    readonly headers           : Header_Obj;
    readonly instr_line_nrs    : i53[];
    readonly opcodes           : Opcode[];
    readonly operant_strings   : string[][];
    readonly operant_types     : Operant_Type[][];
    readonly operant_values    : i53[][];
    readonly labels            : Record<string, Label>;
}

interface Parse_Options {
    constants?: Record<string, string>
}

enum Labeled {
    None, INST, DW, Label
}

export function parse(source: string, options: Parse_Options = {}): Parser_output
{
    const out = new Parser_output();
    Object.assign(out.constants, options.constants ?? {});
    out.lines = source.split('\n').map(line => 
        line.replace(/,/g, "").replace(/\s+/g, " ").replace(/\/\/.*/g, "").trim()
    );
    //\TODO: multiline comments
    for (let i = 0; i < enum_count(URCL_Header); i++){
        out.headers[i as URCL_Header] = {value: urcl_headers[i as URCL_Header].def};
        out.headers[i as URCL_Header].operant = urcl_headers[i as URCL_Header].def_operant;
    }
    let label: undefined | Label;
    let last_label: undefined | Label;
    let labeled = Labeled.None as Labeled;
    const inst_is: number[] = [];
    for (let line_nr = 0, inst_i = 0; line_nr < out.lines.length; line_nr++){
        inst_is.push(inst_i);
        const line = out.lines[line_nr];
        if (line === ""){continue;};
        last_label = label;
        if (label = parse_label(line, line_nr, inst_i, out, out.warnings)){continue;}
        if (parse_header(line, line_nr, out.headers, out.warnings)){continue;}
        if (split_instruction(line, line_nr, inst_i, out, out.errors)){
            if (last_label && labeled === Labeled.DW){
                out.warnings.push(warn(line_nr, `Label at data->instruction boundary`));
            }
            labeled = Labeled.INST;
            inst_i++; continue;
        }
        if (line.startsWith("@")){
            const [macro, ...parts] = line.split(" ");
            if (macro.toLowerCase() === "@define"){
                if (parts.length < 2){
                    out.warnings.push(warn(line_nr, `Expected 2 arguments for @define macro, got [${parts}]`));
                    continue;
                }
                const [name, value] = parts;
                if (out.constants[name.toUpperCase()] !== undefined){
                    out.warnings.push(warn(line_nr, `Redefinition of macro ${name}`));
                }
                out.constants[name.toUpperCase()] = value;
                continue
            }
            if (macro.toLowerCase() === "@debug") {
                continue;
            }
            out.warnings.push(warn(line_nr, `Unknown marco ${macro}`));
            continue
        }
        if (line.toUpperCase().startsWith("DW")){
            let [_, ...value_strs] = line.split(" ");
            if (value_strs.length > 1){
                if (value_strs[0][0] !== "[" || value_strs.at(-1)?.at(-1) !== "]"){
                    out.warnings.push(warn(line_nr, `Omitting square brackets around a value list is not standard`));
                }
                value_strs[0] = value_strs[0].replace("[", "").trim();
                if (value_strs[0].length === 0){value_strs.shift();}
                value_strs[value_strs.length-1] = value_strs.at(-1)?.replaceAll("]", "").trim() ?? "";
                if (value_strs.at(-1)?.length === 0){value_strs.pop();}
            }
            if (last_label){
                if (labeled === Labeled.INST){
                    out.warnings.push(warn(line_nr, `Label at instruction->data boundary`));
                }
                last_label.type = Label_Type.DW;
                last_label.index = out.data.length;
            }
            labeled = Labeled.DW;
            let i = 0;
            while (i < value_strs.length){
                const res = parse_operant(()=>value_strs[i++], line_nr, -1, out.labels, out.constants, out.data, [], []);
                if (res?.[0] !== Operant_Type.String){
                    out.data.push(res ? res[1] : -1);
                }
            }
            continue;
        }
        out.errors.push(warn(line_nr, `Unknown identifier ${line.split(" ")[0]}`));
    }
    out.data.length = 0;
    for (let inst_i = 0; inst_i < out.opcodes.length; inst_i++){
        parse_instructions(out.instr_line_nrs[inst_i], inst_i, out, out.errors, out.warnings);
    }
    for (let line_nr = 0; line_nr < out.lines.length; line_nr++){
        const line = out.lines[line_nr];
        const [start, ...parts] = line.split(" "); 
        if (start.toUpperCase() === "DW"){
            if (parts.length > 1){
                parts[0] = parts[0].replace("[", "").trim();
                if (parts[0].length === 0){parts.shift();}
                parts[parts.length-1] = parts.at(-1)?.replaceAll("]", "").trim() ?? "";
                if (parts.at(-1)?.length === 0){parts.pop();}
            }
            let i = 0;
            while (i < parts.length){
                const res = parse_operant(()=>parts[i++], line_nr, -1, out.labels, out.constants, out.data, out.errors, out.warnings);
                if (res?.[0] !== Operant_Type.String){
                    out.data.push(res ? res[1] : -1);
                }
            }
        }
        if (start.toUpperCase() === "@DEBUG"){
            const inst_i = inst_is[line_nr];
            const flag_arr: Break[] = [];
            const targets: string[] = [];
            for (const part of parts){
                const flag = enum_from_str(Break, part);
                if (flag !== undefined){
                    flag_arr.push(flag);
                } else {
                    targets.push(part);
                }
            }
            if (targets.length == 0){
                flag_arr.push(Break.ONREAD);
                out.program_breaks[inst_i] = break_flag(flag_arr);
                continue;
            }
            if (flag_arr.length == 0){
                flag_arr.push(Break.ONREAD, Break.ONWRITE);
            }
            const flags = break_flag(flag_arr);
            for (let i = 0; i < targets.length; i++){
                const target = resolve_macro(targets[i], out.constants, line_nr, out.errors);
                if (target == undefined){
                    continue;
                }
                switch (target[0]){
                    case 'r': case 'R': case '$': {
                        const n = try_parse_int(target.slice(1));
                        if (n === undefined){
                            out.errors.push(warn(line_nr, `${target} is not a valid register`));
                            continue;
                        }
                        out.register_breaks[my_parse_int(target.slice(1)) + register_count - 1] = flags;
                    } break;
                    case 'm': case 'M': case '#': {
                        const [base_str, add_str] = target.slice(1).split("+");
                        let index = try_parse_int(base_str);
                        if (index === undefined){
                            out.errors.push(warn(line_nr, `${base_str} is not a valid integer`));
                            continue;
                        }
                        if (add_str){
                            const add = try_parse_int(add_str);
                            if (add === undefined){
                                out.errors.push(warn(line_nr, `${add_str} is not a valid integer`));
                                continue;
                            }
                            index += add;
                        }

                        out.heap_breaks[index] = flags;
                    } break;
                    case '.': {
                        const [label_str, add_str] = target.split("+");
                        const label = out.labels[label_str];
                        if (label === undefined){
                            out.errors.push(warn(line_nr, `Undefined label ${label_str}`));
                            continue;
                        }
                        let index = label.index;
                        if (add_str){
                            const add = try_parse_int(add_str);
                            if (add === undefined){
                                out.errors.push(warn(line_nr, `${add_str} is not a valid integer`));
                                continue;
                            }
                            index += add;
                        }
                        if (label.type === Label_Type.DW){
                            out.data_breaks[index] = flags;
                        } else { // label.type === Label_Type.Inst
                            out.program_breaks[index] = flags;
                        }
                    } break;
                    case '%': {
                        const port = resolve_port(target, line_nr, out.errors);
                        if (port === undefined) {
                            continue;
                        }
                        out.port_breaks[port] = flags;
                    } break;
                    default: {
                        if (target.toUpperCase() === "PC"){
                            out.register_breaks[Register.PC] = flags;
                            continue;
                        }
                        if (target.toUpperCase() === "SP"){
                            out.register_breaks[Register.SP] = flags;
                            continue;
                        }

                        out.warnings.push(warn(line_nr, `Unknown debug target/flag, expected register, heap location or label or one of [${enum_strings(Break)}]`));
                    } break;
                }
            }
        }
    }
    return out;
}

// return whether the line contains a header
function parse_header(line: string, line_nr: number, headers: Header_Obj, errors: Warning[]):
    boolean
{
    const [header_str, opOrVal_str, val_str] = line.split(" ") as (string | undefined)[];
    if (header_str === undefined){
        return false;
    }
    const header: URCL_Header | undefined = URCL_Header[header_str.toUpperCase() as any] as any;
    if (header === undefined){
        return false;
    }
    const header_def = urcl_headers[header];
    if (header_def.def_operant !== undefined){
        if (opOrVal_str === undefined){
            errors.push(warn(line_nr,
                `Missing operant for header ${header_str}, must be ${enum_strings(Header_Operant)}`
            )); 
        }
        const operant = enum_from_str(Header_Operant, opOrVal_str||"");
        if (operant === undefined && opOrVal_str !== undefined){
            errors.push(warn(line_nr,
                `Unknown operant ${opOrVal_str} for header ${header_str}, must be ${enum_strings(Header_Operant)}`
            )); 
        }
        const value= check_value(val_str);
        if (operant !== undefined && value !== undefined){
            headers[header] = {line_nr, operant, value};
        }
    } else {
        let value = check_value(opOrVal_str);
        if (value !== undefined){
            headers[header] = {line_nr, value};
        }
    }
    return true;

    function check_value(value: string | undefined): number | undefined {
        if (value === undefined){
            errors.push(warn(line_nr, `Missing value for header ${header_str}`));
            return undefined;
        }
        if (header_def.in){
            const num = enum_from_str(header_def.in, value.toUpperCase());
            if (num === undefined){
                errors.push(warn(line_nr, 
                    `Value ${value} for header ${header_str} most be one of: ${enum_strings(header_def.in)}`
                ));
                return undefined;
            }
            return num;
        } else {
            const num = my_parse_int(value);
            if (!Number.isInteger(num)){
                errors.push(warn(line_nr,
                    `Value ${value} for header ${header_str} must be an integer`
                ));
                return undefined;
            }
            return num;
        }
    }
}

// returns whether the line contains a label
function parse_label(line: string, line_nr: number, inst_i: number, out: Label_Out, warnings: Warning[]): undefined | Label {
    if (!line.startsWith(".")){
        return undefined
    };
    const name = str_until(str_until(line, " ").slice(0), "//");
    if (name === "."){
        warnings.push(warn(line_nr, `Empty label`));
    }
    if (out.labels[name] !== undefined){
        warnings.push(warn(line_nr, `Duplicate label ${name}`));
    }
    const label: Label = {type: Label_Type.Inst, index: inst_i};
    out.labels[name] = label;
    return label;
}

// returns the length of the instruction or 0 if there is an error
function split_instruction
(line: string, line_nr: number, inst_i: number, out: Instruction_Out, errors: Warning[]): boolean
{
    const [opcode_str, ...ops] = line
        .replace(/' /g, "'\xA0").replace(/,/g, "").split(" ");
    const opcode = enum_from_str(Opcode, opcode_str.toUpperCase().replace("@", "__"));
    if (opcode === undefined){
        return false;
    }
    const operant_count = Opcodes_operant_counts[opcode];
    if (ops.length != operant_count){
        errors.push(warn(line_nr,
            `Expected ${operant_count} operants but got [${ops}] for opcode ${opcode_str}`
        ));
    }
    out.opcodes[inst_i] = opcode;
    out.operant_strings[inst_i] = ops;
    out.instr_line_nrs[inst_i] = line_nr;
    
    return true;
}
function parse_instructions(line_nr: number, inst_i: number, out: Parser_output, errors: Warning[], warnings: Warning[]): number {
    const types: number[] = out.operant_types[inst_i] = [];
    const values: number[] = out.operant_values[inst_i] = [];
    let i = 0;
    const strings = out.operant_strings[inst_i];
    while (i < strings.length){
        const [type, value] = parse_operant(()=>strings[i++], line_nr, inst_i, out.labels, out.constants, out.data, errors, warnings) ?? [];
        if (type === Operant_Type.String){
            errors.push(warn(line_nr, "Strings are not allowed in instructions"));
        } else if (type !== undefined){
            types.push(type);
            values.push(value as number);
        }
        
    }
    return 0;
}

function resolve_macro(operant: string, macro_constants: Record<string, string>, line_nr: number, errors: Warning[]): string | undefined{
    for (let i = 0; i < 10; i++){
        const macro: undefined | string = macro_constants[operant.toUpperCase()];
        if (macro !== undefined){
            operant = macro;
        } else {
            break;
        }
        if (i >= 9){
            errors.push(warn(line_nr, `Recursive macro (${operant} -> ${macro})`));
            return undefined;
        }
    }
    return operant;
}

function resolve_port(operant: string, line_nr: number, errors: Warning[]): undefined | number {
    let port: undefined | number;
    if (is_digit(operant, 1)){
        port = try_parse_int(operant.slice(1));
        if (port === undefined){
            errors.push(warn(line_nr, `Invalid port number ${operant}`)); return undefined;
        }
    } else {
        port = enum_from_str(IO_Port, operant.slice(1).toUpperCase());
        if (port === undefined){
            errors.push(warn(line_nr, `Unkown port ${operant}`)); return undefined;
        }
    }
    return port;
}

function parse_operant(
    get_operant: ()=> undefined|string, line_nr: number, inst_i: number, labels: {[K in string]?: Label},
    macro_constants: Record<string, string>, data: Word[],
    errors: Warning[], warnings: Warning[]
):
    undefined | [type: Operant_Type, value: Word]
{
    let operant = get_operant() as string;
    if (operant === undefined){
        return undefined;
    }
    for (let i = 0; i < 10; i++){
        const macro = macro_constants[operant.toUpperCase()];
        if (macro !== undefined){
            operant = macro;
        } else {
            break;
        }
        if (i >= 9){
            errors.push(warn(line_nr, `Recursive macro (${operant} -> ${macro})`));
            return undefined;
        }
    }

    switch (operant.toUpperCase()){
        case "R0": case "$0": return [Operant_Type.Imm, 0];
        case "PC": return [Operant_Type.Reg, Register.PC];
        case "SP": return [Operant_Type.Reg, Register.SP];
    }
    switch (operant[0]){
        case '.': {
            const label = labels[operant];
            if (label === undefined){
                errors.push(warn(line_nr, `Undefined label ${operant}`)); return undefined; 
            }
            const {type, index} = label;
            if (type === Label_Type.Inst){
                return [Operant_Type.Label, index];
            }
            if (type === Label_Type.DW){
                return [Operant_Type.Data_Label, index];
            }
        }
        case '~': {
            const value = my_parse_int(operant.slice(1));
            if (!Number.isInteger(value)){
                errors.push(warn(line_nr, `Invalid relative address ${operant}`)); return undefined;
            }
            return [Operant_Type.Label, value + inst_i];
        }
        case 'R': case 'r': case '$': {
            const value = my_parse_int(operant.slice(1));
            if (!Number.isInteger(value)){
                errors.push(warn(line_nr, `Invalid register ${operant}`)); return undefined;
            }
            return [Operant_Type.Reg, value + register_count-1];
        }
        case 'M': case 'm': case '#': {
            const value = my_parse_int(operant.slice(1));
            if (!Number.isInteger(value)){
                errors.push(warn(line_nr, `Invalid memory address ${operant}`)); return undefined;
            }
            return [Operant_Type.Memory, value];
        }
        case '%': {
            const port = resolve_port(operant, line_nr, errors) ?? NaN;
            return [Operant_Type.Imm, port];
        }
        case '\'': {
            let char_lit;
            if (operant.length === 1){
                operant += " " + get_operant() ?? "";
            }
            try {
                char_lit = JSON.parse(operant.replace(/"/g, "\\\"").replace(/'/g, '"')) as string;
            } catch (e) {
                errors.push(warn(line_nr, `Invalid character ${operant}\n  ${e}`));
                return undefined;
            }
            return [Operant_Type.Imm, char_lit.codePointAt(0) ?? char_lit.charCodeAt(0)];
        }
        case '"': {
            let i = 1;
            const value = data.length;
            while (true){
                i = operant.indexOf('"', 1);
                if (i > 0 && operant[i-1] !== "\\" || operant[i-2] === "\\"){
                    let string = "";
                    try {
                        string = JSON.parse(operant) as string;
                    } catch (e) {
                        errors.push(warn(line_nr, `Invalid string ${operant}\n  ${e}`));
                        return undefined;
                    }
                    for (let i = 0; i < string.length; i++){
                        data.push(string.codePointAt(i) ?? 0);
                    }
                    return [Operant_Type.String, value];
                }
                const next = get_operant();
                if (next === undefined){
                    errors.push(warn(line_nr, `missing end of string`));
                    return [Operant_Type.String, value];
                }
                operant += " " + next; 
            }
        }
        case '&': warnings.push(warn(line_nr, `Compiler constants with & are deprecated`));
        case '@': {
            const constant = enum_from_str(Constants, operant.slice(1).toUpperCase());
            if (constant === undefined){
                errors.push(warn(line_nr, `Unkown Compiler Constant ${operant}`));
                return undefined;
            }
            return [Operant_Type.Constant, constant];
        }
        default: {
            if (operant.endsWith("f32")){
                const value = my_parse_f32(operant);
                if (value === undefined){
                    errors.push(warn(line_nr, `Invalid immediate float ${operant}`)); return undefined;
                }
                return [Operant_Type.Imm, value];
            } else if (operant.endsWith("f16")){
                const value = my_parse_float(operant);
                if (value === undefined){
                    errors.push(warn(line_nr, `Invalid immediate float ${operant}`)); return undefined;
                }
                return [Operant_Type.Imm, f16_encode(value)];
            } else {
                const value = my_parse_int(operant);
                if (!Number.isInteger(value)){
                    errors.push(warn(line_nr, `Invalid immediate int ${operant}`)); return undefined;
                }
                return [Operant_Type.Imm, value];
            }
        }
    }
}

function str_until(string: string, sub_string: string){
    const end = string.indexOf(sub_string);
    if (end < 0){return string;}
    return string.slice(0, end);
}
