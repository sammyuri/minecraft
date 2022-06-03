import { IO_Port } from "../instructions.js";
export class RNG {
    bits;
    constructor(bits = 8) {
        this.bits = bits;
    }
    inputs = {
        [IO_Port.RNG]: () => 0 | Math.random() * (0xffff_ffff >>> (32 - this.bits))
    };
}
//# sourceMappingURL=rng.js.map