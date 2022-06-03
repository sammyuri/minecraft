import fs from "fs/promises";
import { exit, stdin, stdout } from "process";
import { Console_IO } from "../emulator/devices/console-io.js";
import { Emulator, Step_Result } from "../emulator/emulator.js";
import { compile } from "../emulator/compiler.js";
import { parse } from "../emulator/parser.js";
import { parse_argv } from "./args.js";
import { Storage } from "../emulator/devices/storage.js";
import { URCL_Header } from "../emulator/instructions.js";
import { RNG } from "../emulator/devices/rng.js";

function error(msg: string){
    console.error(`ERROR: ${msg}\n${usage}\n`);
    exit(1);
}

const usage = `Usage: urcx-emu [<...options>] <filename>
    --storage <file>
        the file the storage device should open
    
    --storage-size <kibibytes>
        how big the storage file will be

    --text-file <file>
        file to be read into %TEXT

    --little-endian
        read storage with little endian byte order
`;

const {args, flags} = parse_argv(process.argv, {
    __storage: "",
    __storage_size: 0,
    __text_file: "",
    __little_endian: false
});
const {__storage, __storage_size, __text_file, __little_endian} = flags;
if (args.length < 1){
    throw new Error("Not enough arguments");
}

const urcl = (await fs.readFile(args[0])).toString();

const emulator = new Emulator({on_continue});
const console_io = new Console_IO({
    read(callback){
        stdin.resume();
        stdin.once("data", (data) => {
            this.text = data.toString().replace(/\r\n/g, "\n");
            callback();
            stdin.pause();
        });
    },
    text: "",
    }, 
    (text) => {stdout.write(text)},
    () => {/*nothing todo here program is only executed ones*/}
);
emulator.add_io_device(console_io)
emulator.add_io_device(new RNG())

const code = parse(urcl);
if (code.errors.length > 0){
    console.error(code.errors, code.warnings);
    exit(1);
}
if (code.warnings.length > 0){
    console.warn(code.warnings);
}
const [program, debug_info] = compile(code);
debug_info.file_name = args[0];

emulator.load_program(program, debug_info);
let storage: undefined | Storage
if (__storage){
    const file: Uint8Array = (await fs.readFile(__storage));
    let bytes = file;
    storage = new Storage(program.headers[URCL_Header.BITS].value, bytes, __little_endian, __storage_size*1024);
    emulator.add_io_device(storage);
}

if (__text_file){
    const text = (await fs.readFile(__text_file, {"encoding": "utf-8"})).toString() + "\0";
    console_io.set_text(text);
}
setTimeout(on_continue, 1);


async function on_continue(){
    try {
        const [res, its] = emulator.run(2000)
        switch (res){
            case Step_Result.Continue: {
                emulator.warn("Long running program");
                setTimeout(on_continue, 1); 
            } break;
            case Step_Result.Input: break;
            case Step_Result.Halt: {
                await on_halt();
                exit(0);
            } break;
            default: {
                console.error("\nunknown step result");
            }
        }
    } catch (e) {
        console.error((e as Error).message);
        exit(1);
    }
}


async function on_halt(){
    if (__storage && storage){
        await fs.writeFile(__storage, storage.get_bytes());
    }
}
