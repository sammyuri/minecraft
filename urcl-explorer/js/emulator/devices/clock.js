import { IO_Port } from "../instructions.js";
export class Clock {
    wait_end = 0;
    time_out;
    inputs = {
        [IO_Port.WAIT]: this.wait_in,
    };
    outputs = {
        [IO_Port.WAIT]: this.wait_out,
    };
    wait_out(time) {
        this.wait_end = Date.now() + time;
    }
    wait_in(callback) {
        this.time_out = setTimeout(() => callback(1), this.wait_end - Date.now());
    }
    reset() {
        this.wait_end = 0;
        if (this.time_out !== undefined) {
            clearTimeout(this.time_out);
        }
    }
}
//# sourceMappingURL=clock.js.map