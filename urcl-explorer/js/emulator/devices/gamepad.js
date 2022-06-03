import { IO_Port } from "../instructions.js";
export var Gamepad_Key;
(function (Gamepad_Key) {
    Gamepad_Key[Gamepad_Key["A"] = 0] = "A";
    Gamepad_Key[Gamepad_Key["B"] = 1] = "B";
    Gamepad_Key[Gamepad_Key["SELECT"] = 2] = "SELECT";
    Gamepad_Key[Gamepad_Key["START"] = 3] = "START";
    Gamepad_Key[Gamepad_Key["LEFT"] = 4] = "LEFT";
    Gamepad_Key[Gamepad_Key["RIGHT"] = 5] = "RIGHT";
    Gamepad_Key[Gamepad_Key["UP"] = 6] = "UP";
    Gamepad_Key[Gamepad_Key["DOWN"] = 7] = "DOWN";
})(Gamepad_Key || (Gamepad_Key = {}));
const { A, B, SELECT, START, LEFT, RIGHT, UP, DOWN } = Gamepad_Key;
function k(key, pad = 0) {
    return { key, pad };
}
export class Pad {
    keymap;
    pads = [0];
    selected = 0;
    constructor(options = {}) {
        this.keymap = options.keymap ?? {
            keyk: k(A), keyj: k(B), keyn: k(START), keyv: k(SELECT), keya: k(LEFT), keyd: k(RIGHT), keyw: k(UP), keys: k(DOWN),
        };
        addEventListener("keydown", this.onkeydown.bind(this));
        addEventListener("keyup", this.onkeyup.bind(this));
    }
    inputs = {
        [IO_Port.GAMEPAD]: () => this.pads[this.selected] ?? 0
    };
    outputs = {
        [IO_Port.GAMEPAD]: (i) => this.selected = i
    };
    key(e) {
        return this.keymap[e.code.toLowerCase()];
    }
    onkeydown(e) {
        const k = this.key(e);
        if (k !== undefined) {
            this.pads[k.pad] |= 1 << k.key;
        }
    }
    onkeyup(e) {
        const k = this.key(e);
        if (k !== undefined) {
            this.pads[k.pad] &= ~(1 << k.key);
        }
    }
}
//# sourceMappingURL=gamepad.js.map