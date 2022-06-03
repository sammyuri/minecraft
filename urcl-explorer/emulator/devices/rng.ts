import { IO_Port } from "../instructions.js";
import { Device } from "./device.js";

export class RNG implements Device {
    constructor(public bits: number = 8){}
    inputs = {
        [IO_Port.RNG]: () => 0| Math.random() * (0xffff_ffff >>> (32-this.bits))
    };
}