import { IO_Port } from "../instructions.js";
import { f32_encode, f32_decode, f16_decode, f16_encode } from "../util.js";
function sepperate(str) {
    let out = "";
    const seg_len = 4;
    for (let i = 0; i < str.length; i += seg_len) {
        out += "_" + str.substring(i, i + seg_len);
    }
    if (out.startsWith("_")) {
        out = out.substring(1);
    }
    return out;
}
export class Console_IO {
    input;
    write;
    _reset;
    bits = 32;
    constructor(input, write, _reset) {
        this.input = input;
        this.write = write;
        this._reset = _reset;
    }
    inputs = {
        [IO_Port.TEXT]: this.text_in,
        [IO_Port.NUMB]: this.numb_in,
        [IO_Port.FLOAT]: (cb) => {
            if (this.bits >= 32) {
                this.numb_in(cb, s => f32_encode(Number(s)));
            }
            else if (this.bits >= 16) {
                this.numb_in(cb, s => f16_encode(Number(s)));
            }
            else {
                throw new Error(`8 bit floats are not supported`);
            }
        },
        [IO_Port.FIXED]: (cb) => {
            this.numb_in(cb, s => Math.floor(Number(s) * (2 ** (this.bits / 2))));
        }
    };
    outputs = {
        [IO_Port.TEXT]: this.text_out,
        [IO_Port.NUMB]: this.numb_out,
        [IO_Port.UINT]: this.numb_out,
        [IO_Port.HEX]: (v) => this.write(sepperate(v.toString(16).padStart(Math.ceil(this.bits / 4), "0"))),
        [IO_Port.BIN]: (v) => this.write(sepperate(v.toString(2).padStart(this.bits, "0"))),
        [IO_Port.FLOAT]: (v) => {
            if (this.bits >= 32) {
                this.write(f32_decode(v).toString());
            }
            else if (this.bits >= 16) {
                this.write(f16_decode(v).toString());
            }
            else {
                throw new Error(`8 bit floats are not supported`);
            }
        },
        [IO_Port.FIXED]: (v) => {
            this.write((v / (2 ** (this.bits / 2))).toString());
        },
        [IO_Port.INT]: (v) => {
            const sign_bit = 2 ** (this.bits - 1);
            if (v & sign_bit) {
                v = (v & (sign_bit - 1)) - sign_bit;
            }
            this.write(v.toString());
        },
        // TODO: make specific implementations for these
        [IO_Port.ASCII]: this.text_out,
        [IO_Port.CHAR5]: this.text_out,
        [IO_Port.CHAR6]: this.text_out,
        [IO_Port.ASCII]: this.text_out,
        [IO_Port.UTF8]: this.text_out,
        [IO_Port.UTF16]: this.text_out,
        [IO_Port.UTF32]: this.text_out,
    };
    set_text(text) {
        this.input.text = text;
    }
    reset() {
        this.input.text = "";
        this._reset();
    }
    text_in(callback) {
        if (this.input.text.length === 0) {
            this.input.read(() => {
                const char_code = this.input.text.codePointAt(0) ?? this.input.text.charCodeAt(0);
                this.input.text = this.input.text.slice(1);
                callback(char_code);
            });
            return undefined;
        }
        const char_code = this.input.text.charCodeAt(0);
        this.input.text = this.input.text.slice(1);
        return char_code;
    }
    text_out(value) {
        this.write(String.fromCodePoint(value));
    }
    numb_in(callback, parse = parseInt) {
        if (this.input.text.length !== 0) {
            const num = parse(this.input.text);
            if (!Number.isNaN(num)) {
                this.input.text = this.input.text.trimStart().slice(num.toString().length);
                return num;
            }
        }
        this.input.read(() => {
            const num = this.numb_in(callback, parse);
            if (num !== undefined) {
                callback(num);
            }
        });
    }
    numb_out(value) {
        this.write("" + value);
    }
}
//# sourceMappingURL=console-io.js.map