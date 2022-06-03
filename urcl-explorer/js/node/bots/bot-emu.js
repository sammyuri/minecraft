import fetch from "node-fetch";
import { compile } from "../../emulator/compiler.js";
import { Console_IO } from "../../emulator/devices/console-io.js";
import { Emulator, Step_Result } from "../../emulator/emulator.js";
import { parse } from "../../emulator/parser.js";
import { enum_strings, expand_warnings, memoryToString, registers_to_string } from "../../emulator/util.js";
import { parse_argv } from "../args.js";
import Canvas from "canvas";
import { Color_Mode, Display } from "../../emulator/devices/display.js";
import { URCL_Header } from "../../emulator/instructions.js";
import { Storage } from "../../emulator/devices/storage.js";
import { RNG } from "../../emulator/devices/rng.js";
const emus = new Map();
function get_emu(id) {
    let emu = emus.get(id);
    if (!emu) {
        emu = discord_emu();
        emus.set(id, emu);
    }
    return emu;
}
var TextEnd;
(function (TextEnd) {
    TextEnd[TextEnd["LF"] = 0] = "LF";
    TextEnd[TextEnd["Null"] = 1] = "Null";
    TextEnd[TextEnd["None"] = 2] = "None";
})(TextEnd || (TextEnd = {}));
export function emu_start(id, argv, source) {
    const emu = get_emu(id);
    return emu.start(argv, source);
}
export function emu_reply(id, msg) {
    const emu = get_emu(id);
    return emu.reply(msg);
}
export function emu_stop(id) {
    let emu = emus.get(id);
    if (!emu) {
        return "There is not emulator running for this channel";
    }
    return emu.stop();
}
const max_time = 1000;
function discord_emu() {
    let state = Step_Result.Halt;
    let busy = false;
    let stdout = "";
    let std_info = "";
    let text_cb;
    let scale = 1;
    let rendered_count = 0;
    let quality = 10;
    let text_end = "\n";
    let storage;
    let argv_res;
    const emulator = new Emulator({ on_continue, warn: (str) => std_info += str + "\n", max_memory: () => 1024 * 1024 * 512 });
    emulator.add_io_device(new RNG());
    let display = new Display(Canvas.createCanvas(1, 1).getContext("2d"), 8, Color_Mode.PICO8, true);
    const console_io = new Console_IO({
        read(callback) {
            text_cb = callback;
        },
        text: "",
    }, (text) => { stdout += text; }, () => { });
    emulator.add_io_device(console_io);
    const pub = { start, stop, reply };
    return pub;
    function on_continue() {
        try {
            const [res, steps] = emulator.run(max_time);
            state = res;
            switch (res) {
                case Step_Result.Continue:
                    {
                        std_info += `\nProgram took more than ${max_time}ms and is paused.\n`
                            + "Continue the program by sending a ?";
                    }
                    break;
                case Step_Result.Input:
                    {
                        std_info += "\nSend a message starting with ? to input\n";
                    }
                    break;
                case Step_Result.Halt:
                    {
                        std_info += "\nProgram Halted!\n";
                    }
                    break;
                default: {
                    state = Step_Result.Halt;
                    throw new Error("\nunknown step result");
                }
            }
        }
        catch (e) {
            std_info += `[ERROR]: ${e}`;
            state = Step_Result.Halt;
        }
        std_info += "\nregisters:\n" + registers_to_string(emulator);
        if (argv_res.flags.__mem_start !== argv_res.flags.__mem_end) {
            std_info += `\n\nmemory:\n` + memoryToString(emulator.memory, argv_res.flags.__mem_start, argv_res.flags.__mem_end, emulator.bits) + "\n\n";
        }
    }
    function reset() {
        stdout = "";
        std_info = "";
        emulator.reset();
        emulator.shrink_buffer();
        storage = undefined;
        display.buffers.length = 0;
    }
    function o() {
        const out = stdout;
        const info = std_info;
        const all_screens = display.buffers.slice();
        const screens = all_screens.slice(rendered_count);
        std_info = "";
        rendered_count = all_screens.length;
        return { out, info, screens, all_screens, scale, state, quality, storage: storage?.get_bytes() };
    }
    function start(argv, source) {
        reset();
        if (busy) {
            std_info += "Emulator is still busy loading the previous program";
            return o();
        }
        busy = true;
        const res = _start(argv, source);
        res.then(() => busy = false).catch(() => busy = false);
        return res;
    }
    async function _start(argv, source) {
        try {
            argv_res = parse_argv(["", ...argv], {
                __width: 32,
                __height: 32,
                __color: { val: Color_Mode.PICO8, in: Color_Mode },
                __scale: 1,
                __quality: 10,
                __help: false,
                __text_end: { val: TextEnd.LF, in: TextEnd },
                __storage: "",
                __storage_size: 0,
                __mem_start: 0,
                __mem_end: -1,
                __little_endian: false,
            });
            const { args, flags: { __width, __height, __color, __scale, __quality, __text_end, __help, __storage, __storage_size, __little_endian } } = argv_res;
            const usage = `Usage:
start emulator: 
    !urcx-emu [<...options>] [<source url>]
    [\`\`\`
    <source code>
    \`\`\`]
    [<attachment of .urcl file>]

continue program:
    ?

enter text:
    ?<text>

options:
    --help
        bring up this menu

    --mem-start <words>
        the start of the memory view, default is 0

    --mem-end <words>
        the end of the memory view, default is -1 for the last word in memory

    --text-end <LF|Null|None>
        Sets what character to append to the end when text is inputted; defaults to LF

    --width <pixels>
        sets width of the display buffer; defaults to 32
    
    --height <pixels>
        sets height of the display buffer; defaults to 32
    
    --color <${enum_strings(Color_Mode).join("|")}>
        sets the color pallet of the display output; defaults to PICO 8

    --scale <number>
        sets the scale of the display output; defaults to 1, meaning the output is the same size as the buffer

    --storage <file>
        the file the storage device should open
    
    --storage-size <kibibytes>
        how big the storage file will be

    --little-endian
        read storage with little endian byte order
`;
            if (__help) {
                std_info = usage;
                return o();
            }
            text_end = __text_end.val === TextEnd.LF ? "\n" : (__text_end.val === TextEnd.Null ? "\0" : "");
            scale = __scale;
            quality = __quality;
            const file_name = args[0];
            let s_name;
            if (!(source?.length)) {
                if (file_name === undefined) {
                    std_info += `ERROR: no source specified`;
                    return o();
                }
                source = await (await fetch(file_name)).text();
                s_name = file_name.split("/").at(-1);
            }
            const code = parse(source);
            if (code.errors.length > 0) {
                std_info += "ERRORS:\n"
                    + expand_warnings(code.errors, code.lines, s_name)
                    + "\n------------------------------\n";
            }
            if (code.warnings.length > 0) {
                std_info += "warnings:\n"
                    + expand_warnings(code.warnings, code.lines, s_name);
                +"\n------------------------------\n";
            }
            if (code.errors.length > 0) {
                return o();
            }
            const [program, debug_info] = compile(code);
            emulator.load_program(program, debug_info);
            if (__storage || __storage_size) {
                let bytes;
                if (__storage) {
                    const buf = await (await fetch(__storage)).arrayBuffer();
                    bytes = new Uint8Array(buf);
                }
                else {
                    bytes = new Uint8Array();
                }
                storage = new Storage(program.headers[URCL_Header.BITS].value, bytes, __little_endian, __storage_size * 1024);
                emulator.add_io_device(storage);
            }
            const canvas = Canvas.createCanvas(__width, __height);
            const ctx = canvas.getContext("2d", { alpha: false });
            display = new Display(ctx, program.headers[URCL_Header.BITS].value, __color.val, true);
            emulator.add_io_device(display);
            state = Step_Result.Continue;
            on_continue();
            return o();
        }
        catch (e) {
            std_info += `\nERROR: ${e}`;
            return o();
        }
    }
    function reply(msg) {
        try {
            if (state === Step_Result.Halt) {
                reset();
                std_info += `No Program running`;
                return o();
            }
            if (!text_cb) {
                std_info += "Continuing program without adding input";
                on_continue();
                return o();
            }
            console_io.input.text += msg + text_end;
            const cb = text_cb;
            text_cb = undefined;
            cb();
            return o();
        }
        catch (e) {
            std_info += `\nERROR: ${e}`;
            return o();
        }
    }
    function stop() {
        return "not implemented";
    }
}
//# sourceMappingURL=bot-emu.js.map