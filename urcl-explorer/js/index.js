var _a, _b, _c, _d;
import { compile } from "./emulator/compiler.js";
import { Clock } from "./emulator/devices/clock.js";
import { Console_IO } from "./emulator/devices/console-io.js";
import { Color_Mode } from "./emulator/devices/display.js";
import { Gamepad_Key, Pad } from "./emulator/devices/gamepad.js";
import { Gl_Display } from "./emulator/devices/gl-display.js";
import { Keyboard } from "./emulator/devices/keyboard.js";
import { RNG } from "./emulator/devices/rng.js";
import { Sound } from "./emulator/devices/sound.js";
import { Storage } from "./emulator/devices/storage.js";
import { Emulator, Step_Result } from "./emulator/emulator.js";
import { parse } from "./emulator/parser.js";
import { enum_from_str, enum_strings, expand_warning, registers_to_string, memoryToString, format_int } from "./emulator/util.js";
//CHUNGUS devices
import { CraftingRom } from "./emulator/devices/CHUNGUS devices/craftingRom.js";
import { PlayerInput } from "./emulator/devices/CHUNGUS devices/playerInput.js";
import { BlockRAM } from "./emulator/devices/CHUNGUS devices/blockRAM.js";
import { MeshGen } from "./emulator/devices/CHUNGUS devices/blockToMesh.js";
import { Amogus } from "./emulator/devices/CHUNGUS devices/amogus.js";
import { Screen } from "./emulator/devices/CHUNGUS devices/screen.js";
let animation_frame;
let running = false;
let started = false;
let input = false;
let last_step = performance.now();
let clock_speed = 0;
let clock_count = 0;
const source_input = document.getElementById("urcl-source");
const output_element = document.getElementById("output");
const debug_output_element = document.getElementById("debug-output");
const memory_view = document.getElementById("memory-view");
const register_view = document.getElementById("register-view");
const console_input = document.getElementById("stdin");
const console_output = document.getElementById("stdout");
const null_terminate_input = document.getElementById("null-terminate");
const share_button = document.getElementById("share-button");
const auto_run_input = document.getElementById("auto-run-input");
const storage_input = document.getElementById("storage-input");
const storage_msg = document.getElementById("storage-msg");
const storage_little = document.getElementById("storage-little");
const storage_update = document.getElementById("storage-update");
const storage_download = document.getElementById("storage-download");
const clock_speed_input = document.getElementById("clock-speed-input");
const clock_speed_output = document.getElementById("clock-speed-output");
const memory_update_input = document.getElementById("update-mem-input");
const url = new URL(location.href, location.origin);
const srcurl = url.searchParams.get("srcurl");
const width = parseInt((_a = url.searchParams.get("width")) !== null && _a !== void 0 ? _a : "");
const height = parseInt((_b = url.searchParams.get("height")) !== null && _b !== void 0 ? _b : "");
const color = enum_from_str(Color_Mode, (_c = url.searchParams.get("color")) !== null && _c !== void 0 ? _c : "");
console.log(color);
memory_update_input.oninput = () => update_views();
const max_clock_speed = 40000000;
const max_its = 1.2 * max_clock_speed / 16;
clock_speed_input.oninput = change_clockspeed;
function change_clockspeed() {
    clock_speed = Math.min(max_clock_speed, Math.max(0, Number(clock_speed_input.value) || 0));
    clock_speed_output.value = "" + clock_speed;
    last_step = performance.now();
}
change_clockspeed();
share_button.onclick = e => {
    const srcurl = `data:text/plain;base64,${btoa(source_input.value)}`;
    const share = new URL(location.href);
    share.searchParams.set("srcurl", srcurl);
    share.searchParams.set("width", "" + canvas.width);
    share.searchParams.set("height", "" + canvas.height);
    share.searchParams.set("color", Color_Mode[display.color_mode]);
    navigator.clipboard.writeText(share.href);
};
let storage_uploaded;
let storage_device;
let storage_loads = 0;
storage_little.oninput =
    storage_input.oninput = async (e) => {
        storage_msg.classList.remove("error");
        const files = storage_input.files;
        if (files === null || files.length < 1) {
            storage_msg.classList.add("error");
            storage_msg.innerText = "No file specified";
            return;
        }
        const file = files[0];
        try {
            const data = await file.arrayBuffer();
            storage_uploaded = new Uint8Array(data);
            const bytes = storage_uploaded.slice();
            emulator.add_io_device(storage_device = new Storage(emulator.bits, bytes, storage_little.checked, bytes.length));
            storage_msg.innerText = `loaded storage device with ${0 | bytes.length / (emulator.bits / 8)} words`;
        }
        catch (error) {
            storage_msg.classList.add("error");
            storage_msg.innerText = "" + error;
        }
    };
storage_update.onclick = e => {
    if (storage_device === undefined) {
        storage_msg.innerText = `No storage to update`;
        return;
    }
    storage_uploaded = storage_device.get_bytes();
    storage_msg.innerText = `Updated storage`;
};
storage_download.onclick = e => {
    if (storage_device === undefined && storage_uploaded === undefined) {
        storage_msg.innerText = `No storage to download`;
        return;
    }
    if (storage_device !== undefined) {
        storage_uploaded = storage_device.get_bytes();
    }
    const url = URL.createObjectURL(new Blob([storage_uploaded]));
    const a = document.createElement("a");
    const file_name = storage_input.value.split(/\\|\//).at(-1);
    a.download = file_name || "storage.bin";
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
let input_callback;
console_input.addEventListener("keydown", e => {
    if (!e.shiftKey && e.key === "Enter" && input_callback) {
        e.preventDefault();
        if (null_terminate_input.checked) {
            console_input.value += "\0";
        }
        else {
            console_input.value += "\n";
        }
        input_callback();
    }
});
const console_io = new Console_IO({
    read(callback) {
        input_callback = callback;
    },
    get text() {
        return console_input.value;
    },
    set text(value) {
        console_input.value = value;
    }
}, (text) => {
    console_output.write(text);
}, () => {
    console_output.clear();
    input_callback = undefined;
});
const canvas = document.getElementsByTagName("canvas")[0];
const gl = canvas.getContext("webgl2");
if (!gl) {
    throw new Error("Unable to get webgl rendering context");
}
canvas.width = width || 96;
canvas.height = height || 64;
const display = new Gl_Display(gl, color);
const color_mode_input = document.getElementById("color-mode");
if (color !== undefined)
    color_mode_input.value = Color_Mode[color];
color_mode_input.addEventListener("change", change_color_mode);
function change_color_mode() {
    const color_mode = enum_from_str(Color_Mode, color_mode_input.value);
    display.color_mode = color_mode !== null && color_mode !== void 0 ? color_mode : display.color_mode;
    display.update_display();
}
const width_input = document.getElementById("display-width");
const height_input = document.getElementById("display-height");
width_input.value = "" + canvas.width;
height_input.value = "" + canvas.height;
width_input.addEventListener("input", resize_display);
height_input.addEventListener("input", resize_display);
resize_display();
function resize_display() {
    const width = parseInt(width_input.value) || 16;
    const height = parseInt(height_input.value) || 16;
    display.resize(width, height);
}
const emulator = new Emulator({ on_continue: frame, warn: (msg) => output_element.innerText += `${msg}\n` });
emulator.add_io_device(new Sound());
emulator.add_io_device(console_io);
emulator.add_io_device(display);
emulator.add_io_device(new Clock());
emulator.add_io_device(new Pad());
emulator.add_io_device(new RNG());
emulator.add_io_device(new Keyboard());
//CHUNGUS devices
emulator.add_io_device(new CraftingRom());
emulator.add_io_device(new PlayerInput());
const blockRAM = new BlockRAM();
emulator.add_io_device(blockRAM);
const screen = new Screen(display);
emulator.add_io_device(screen)
const amogus = new Amogus(screen);
emulator.add_io_device(amogus);
emulator.add_io_device(new MeshGen(blockRAM, amogus));
source_input.oninput = oninput;
auto_run_input.onchange = oninput;
function oninput() {
    if (started) {
        const size = 8; // Math.max(1, 0| (Number(localStorage.getItem("history-size")) || 8));
        localStorage.setItem("history-size", "" + size);
        const offset = (Math.max(0, 0 | (Number(localStorage.getItem("history-offset")) || 0)) + 1) % size;
        localStorage.setItem("history-offset", "" + offset);
        localStorage.setItem(`history-${offset}`, source_input.value);
    }
    if (auto_run_input.checked) {
        compile_and_run();
    }
}
const compile_and_run_button = document.getElementById("compile-and-run-button");
const pause_button = document.getElementById("pause-button");
const compile_and_reset_button = document.getElementById("compile-and-reset-button");
const step_button = document.getElementById("step-button");
compile_and_run_button.addEventListener("click", compile_and_run);
compile_and_reset_button.addEventListener("click", compile_and_reset);
pause_button.addEventListener("click", pause);
step_button.addEventListener("click", step);
function step() {
    process_step_result(emulator.step(), 1);
    clock_speed_output.value = `stepping, executed ${format_int(clock_count)} instructions`;
    console_output.flush();
}
function pause() {
    if (running) {
        if (animation_frame) {
            cancelAnimationFrame(animation_frame);
        }
        animation_frame = undefined;
        pause_button.textContent = "Start";
        running = false;
        step_button.disabled = running || input;
    }
    else {
        animation_frame = requestAnimationFrame(frame);
        pause_button.textContent = "Pause";
        running = true;
        step_button.disabled = running;
    }
}
function compile_and_run() {
    compile_and_reset();
    pause_button.textContent = "Pause";
    pause_button.disabled = false;
    if (!running) {
        running = true;
        step_button.disabled = running;
        frame();
    }
}
function compile_and_reset() {
    clock_count = 0;
    output_element.innerText = "";
    try {
        const source = source_input.value;
        const parsed = parse(source, {
            constants: Object.fromEntries(enum_strings(Gamepad_Key).map(key => ["@" + key, "" + (1 << Gamepad_Key[key])])),
        });
        if (parsed.errors.length > 0) {
            output_element.innerText = parsed.errors.map(v => expand_warning(v, parsed.lines) + "\n").join("");
            output_element.innerText += parsed.warnings.map(v => expand_warning(v, parsed.lines) + "\n").join("");
            return;
        }
        output_element.innerText += parsed.warnings.map(v => expand_warning(v, parsed.lines) + "\n").join("");
        const [program, debug_info] = compile(parsed);
        emulator.load_program(program, debug_info);
        if (storage_uploaded) {
            const bytes = storage_uploaded.slice();
            emulator.add_io_device(storage_device = new Storage(emulator.bits, bytes, storage_little.checked, bytes.length)); // \TODO: add little endian option
            storage_msg.innerText = `loaded storage device with ${0 | bytes.length / (emulator.bits / 8)} words, ${storage_loads++ % 2 === 0 ? "flip" : "flop"}`;
        }
        output_element.innerText += `
compilation done
bits: ${emulator.bits}
register-count: ${emulator.registers.length}
memory-size: ${emulator.memory.length}
`;
        if (animation_frame) {
            cancelAnimationFrame(animation_frame);
        }
        animation_frame = undefined;
        pause_button.textContent = "Start";
        pause_button.disabled = false;
        step_button.disabled = false;
        running = false;
        update_views();
    }
    catch (e) {
        output_element.innerText += e.message;
        throw e;
    }
}
function frame() {
    if (running) {
        try {
            if (clock_speed > 0) {
                const start_time = performance.now();
                const dt = start_time - last_step;
                const its = Math.min(max_its, 0 | dt * clock_speed / 1000);
                const [res, steps] = emulator.burst(its, 16);
                process_step_result(res, steps);
                if (its === max_its || (res === Step_Result.Continue && steps !== its)) {
                    last_step = start_time;
                    clock_speed_output.value = `${format_int(clock_speed)}Hz slowdown to ${format_int(steps * 1000 / 16)}Hz, executed ${format_int(clock_count)} instructions`;
                }
                else {
                    last_step += its * 1000 / clock_speed;
                    clock_speed_output.value = `${format_int(clock_speed)}Hz, executed ${format_int(clock_count)} instructions`;
                }
            }
            else {
                const start_time = performance.now();
                const [res, steps] = emulator.run(16);
                const end_time = performance.now();
                const dt = Math.max(0.1, end_time - start_time);
                process_step_result(res, steps);
                clock_speed_output.value = `${format_int(steps * 1000 / (dt))}Hz, executed ${format_int(clock_count)} instructions`;
            }
        }
        catch (e) {
            output_element.innerText += e.message + "\nProgram Halted";
            update_views();
            throw e;
        }
    }
    else {
        step_button.disabled = false;
        pause_button.disabled = false;
    }
}
function process_step_result(result, steps) {
    clock_count += steps;
    animation_frame = undefined;
    input = false;
    debug_output_element.innerText = "";
    switch (result) {
        case Step_Result.Continue:
            {
                if (running) {
                    animation_frame = requestAnimationFrame(frame);
                    running = true;
                    step_button.disabled = running;
                    pause_button.disabled = false;
                }
            }
            break;
        case Step_Result.Input:
            {
                step_button.disabled = true;
                pause_button.disabled = false;
                input = true;
            }
            break;
        case Step_Result.Halt:
            {
                output_element.innerText += "Program halted";
                step_button.disabled = true;
                pause_button.disabled = true;
                pause_button.textContent = "Start";
                running = false;
            }
            break;
        case Step_Result.Debug:
            {
                if (running) {
                    pause();
                }
                const msg = emulator.get_debug_message();
                if (msg !== undefined) {
                    debug_output_element.innerText = msg;
                }
                else {
                    throw new Error("Debug not handled");
                }
            }
            break;
        default: {
            console.warn("unkown step result");
        }
    }
    update_views();
}
function update_views() {
    const bits = emulator.bits;
    if (memory_update_input.checked) {
        memory_view.innerText = memoryToString(emulator.memory, 0, emulator.memory.length, bits);
    }
    register_view.innerText =
        registers_to_string(emulator);
    const lines = emulator.debug_info.pc_line_nrs;
    const line = lines[Math.min(emulator.pc, lines.length - 1)];
    source_input.set_pc_line(line);
    source_input.set_line_profile(emulator.pc_counters.map((v, i) => [lines[i], v]));
    console_output.flush();
}
change_color_mode();
started = true;
if (srcurl) {
    fetch(srcurl).then(res => res.text()).then((text) => {
        if (source_input.value) {
            return;
        }
        source_input.value = text;
        compile_and_run();
    });
}
else
    autofill: {
        const offset = Number(localStorage.getItem("history-offset"));
        if (!Number.isInteger(offset)) {
            break autofill;
        }
        source_input.value = (_d = localStorage.getItem(`history-${offset}`)) !== null && _d !== void 0 ? _d : "";
    }