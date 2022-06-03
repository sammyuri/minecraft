import * as path from "path"
import { enum_from_str, enum_strings } from "../emulator/util.js";
interface Args<T> {
    command: string,
    args: string[];
    flags: T;
}
type ArgsDef = Record<string, boolean | string | number | {val: number, in: Record<string, any>}>

export function parse_argv<T extends ArgsDef>(argv: string[], defs: T): Args<T> {
    if (argv.length < 2){
        throw new Error(`Argv needs at least 2 elements but got [${argv}]`);
    }
    const command = argv[0] + " " + path.relative("./", argv[1])
    const args: string[] = [];
    const flags: T = Object.assign({}, defs);
    for (let i = 2; i < argv.length; i++){
        const arg = argv[i];
        if (!arg.startsWith("-")){
            args.push(arg);
            continue
        }
        const key = arg.replace(/-/g, "_");
        const value = defs[key];
        if (value === undefined){
            throw Error(`Unknown flag ${key}`);
        }
        switch (typeof value){
        case "string": {
            if (i + 1 >= argv.length){
                throw Error(`Missing argument value for ${arg} of type string`);
            }
            (flags as any)[key] = argv[++i];
        } break;
        case "boolean": {
            (flags as any)[key] = true;
        } break;
        case "number": {
            if (i + 1 >= argv.length){
                throw Error(`Missing argument value for ${arg} of type number`);
            }
            const str = argv[++i];
            const num = Number(str);
            if (Number.isNaN(num)){
                throw Error((`${arg}: ${str} is not a number`));
            }
            (flags as any)[key] = num || 0;
        } break;
        case "object": {
            if (i + 1 >= argv.length){
                throw Error(`Missing argument value for ${arg} of type must be one of [${enum_strings(value.in)}]`);
            }
            const str = argv[++i];
            const num = enum_from_str(value.in, str);
            if (num === undefined){
                throw Error(`${arg}: ${str} must be one of [${enum_strings(value.in)}]`);
            }
            value.val = num;
        } break;
        }
    }
    return {command, args, flags};
}

export function read_all(stream: NodeJS.ReadStream): Promise<string>{
    let string = "";
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => string += chunk);
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(string));
    });
}
