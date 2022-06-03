import { IO_Port } from "../instructions.js";
export var Color_Mode;
(function (Color_Mode) {
    Color_Mode[Color_Mode["RGB"] = 0] = "RGB";
    Color_Mode[Color_Mode["Mono"] = 1] = "Mono";
    Color_Mode[Color_Mode["Bin"] = 2] = "Bin";
    Color_Mode[Color_Mode["RGB8"] = 3] = "RGB8";
    Color_Mode[Color_Mode["RGB16"] = 4] = "RGB16";
    Color_Mode[Color_Mode["RGB24"] = 5] = "RGB24";
    Color_Mode[Color_Mode["RGB6"] = 6] = "RGB6";
    Color_Mode[Color_Mode["RGB12"] = 7] = "RGB12";
    Color_Mode[Color_Mode["PICO8"] = 8] = "PICO8";
    Color_Mode[Color_Mode["RGBI"] = 9] = "RGBI";
})(Color_Mode || (Color_Mode = {}));
export const pico8 = [
    0x000000, 0x1D2B53, 0x7E2553, 0x008751,
    0xAB5236, 0x5F574F, 0xC2C3C7, 0xFFF1E8,
    0xFF004D, 0xFFA300, 0xFFEC27, 0x00E436,
    0x29ADFF, 0x83769C, 0xFF77A8, 0xFFCCAA,
].map(v => [(v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
export class Display {
    bits;
    color_mode;
    save_buffers;
    ctx;
    buffers = [];
    image;
    read_buffer;
    get data() {
        return this.image.data;
    }
    buffer_enabled = 0;
    x = 0;
    y = 0;
    inputs = {
        [IO_Port.COLOR]: this.color_in,
        [IO_Port.X]: this.x_in,
        [IO_Port.Y]: this.y_in,
        [IO_Port.BUFFER]: this.buffer_in,
    };
    outputs = {
        [IO_Port.COLOR]: this.color_out,
        [IO_Port.X]: this.x_out,
        [IO_Port.Y]: this.y_out,
        [IO_Port.BUFFER]: this.buffer_out,
    };
    reset() {
        this.x = 0;
        this.y = 0;
        this.clear();
        this.ctx.putImageData(this.image, 0, 0);
        this.buffer_enabled = 0;
        this.buffers.length = 0;
    }
    constructor(ctx, bits, color_mode = Color_Mode.Bin, save_buffers = false) {
        this.bits = bits;
        this.color_mode = color_mode;
        this.save_buffers = save_buffers;
        const { width, height } = ctx.canvas;
        this.ctx = ctx;
        this.image = ctx.createImageData(width, height);
        this.read_buffer = new Uint32Array(width * height);
    }
    resize(width, height) {
        const ow = this.width, oh = this.height;
        this.image = this.ctx.getImageData(0, 0, width, height);
        this.width = width;
        this.height = height;
        this.ctx.putImageData(this.image, 0, 0);
        const read_buf = new Uint32Array(width * height);
        for (let y = 0; y < height; y++) {
            read_buf.set(this.read_buffer.subarray(y * oh, y * oh + Math.min(width, ow)), y * height);
        }
    }
    clear() {
        for (let i = 0; i < this.data.length; i += 4) {
            this.data[i] = 0x00;
            this.data[i + 1] = 0x00;
            this.data[i + 2] = 0x00;
            this.data[i + 3] = 0xff;
        }
    }
    x_in() {
        return this.width;
    }
    y_in() {
        return this.height;
    }
    x_out(value) {
        this.x = value;
    }
    y_out(value) {
        this.y = value;
    }
    color_in() {
        if (!this.in_bounds(this.x, this.y)) {
            return 0;
        }
        const i = this.x + this.y * this.width;
        return this.read_buffer[i];
    }
    // rrrgggbb
    // rrrrrggggggbbbbb
    // rrrrrrrrggggggggbbbbbbbb
    color_out(color) {
        if (!this.in_bounds(this.x, this.y)) {
            return;
        }
        const i = this.x + this.y * this.width;
        this.data.set(this.short_to_full(color), i * 4);
        this.read_buffer[i] = color;
        if (!this.buffer_enabled) {
            this.ctx.putImageData(this.image, 0, 0);
            if (this.save_buffers) {
                this.buffers.push(this.ctx.getImageData(0, 0, this.width, this.height));
            }
        }
    }
    buffer_in() {
        return this.buffer_enabled;
    }
    buffer_out(value) {
        switch (value) {
            case 0:
                {
                    this.ctx.putImageData(this.image, 0, 0);
                    if (this.save_buffers) {
                        this.buffers.push(this.ctx.getImageData(0, 0, this.width, this.height));
                    }
                    this.clear();
                    this.buffer_enabled = 0;
                }
                ;
                break;
            case 1:
                {
                    this.buffer_enabled = 1;
                }
                break;
            case 2:
                {
                    this.ctx.putImageData(this.image, 0, 0);
                    if (this.save_buffers) {
                        this.buffers.push(this.ctx.getImageData(0, 0, this.width, this.height));
                    }
                }
                break;
        }
    }
    in_bounds(x, y) {
        return x >= 0 && x < this.width
            && y >= 0 && y < this.height;
    }
    short_to_full(short, color_mode = this.color_mode) {
        switch (color_mode) {
            case Color_Mode.RGB: return this.short_to_full_rgb(short);
            case Color_Mode.RGB6: return this.short_to_full_rgb(short, 6);
            case Color_Mode.RGB8: return this.short_to_full_rgb(short, 8);
            case Color_Mode.RGB12: return this.short_to_full_rgb(short, 12);
            case Color_Mode.RGB16: return this.short_to_full_rgb(short, 16);
            case Color_Mode.RGB24: return this.short_to_full_rgb(short, 24);
            case Color_Mode.RGBI: {
                if ((short & 15) == 1) {
                    return [64, 64, 64];
                }
                const r = (short >>> 3) & 1;
                const g = (short >>> 2) & 1;
                const b = (short >>> 1) & 1;
                const i = (short >>> 0) & 1;
                return [(r >> i) * 127, (g >> i) * 127, (b >> i) * 127];
            }
            case Color_Mode.Mono: {
                const val = Math.max(0, Math.min(255, short));
                return [val, val, val];
            }
            case Color_Mode.Bin: {
                const value = short > 0 ? 0xff : 0;
                return [value, value, value];
            }
            case Color_Mode.PICO8: {
                return pico8[short & 15];
            }
            default: return [0xff, 0x00, 0xff];
        }
    }
    short_to_full_rgb(short, bits = this.bits) {
        bits = Math.min(24, bits);
        const blue_bits = 0 | bits / 3;
        const blue_mask = (1 << blue_bits) - 1;
        const red_bits = 0 | (bits - blue_bits) / 2;
        const red_mask = (1 << red_bits) - 1;
        const green_bits = bits - blue_bits - red_bits;
        const green_mask = (1 << green_bits) - 1;
        const green_offset = blue_bits;
        const red_offset = green_offset + green_bits;
        return [
            ((short >>> red_offset) & red_mask) * 255 / red_mask,
            ((short >>> green_offset) & green_mask) * 255 / green_mask,
            ((short) & blue_mask) * 255 / blue_mask,
        ];
    }
    get width() {
        return this.ctx.canvas.width;
    }
    set width(value) {
        this.ctx.canvas.width = value;
    }
    get height() {
        return this.ctx.canvas.height;
    }
    set height(value) {
        this.ctx.canvas.height = value;
    }
}
//# sourceMappingURL=display.js.map