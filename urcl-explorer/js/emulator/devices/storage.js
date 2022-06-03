import { IO_Port } from "../instructions.js";
import { read16, read32, write16, write32 } from "../util.js";
export class Storage {
    bits;
    little_endian;
    constructor(bits, data, little_endian, size) {
        this.bits = bits;
        this.little_endian = little_endian;
        switch (bits) {
            case 8:
                {
                    this.address_mask = 0xff;
                    this.data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
                    if (size > this.data.length) {
                        const old = this.data;
                        this.data = new Uint8Array(size);
                        this.data.set(old);
                    }
                }
                break;
            case 16:
                {
                    this.address_mask = 0xffff;
                    this.data = read16(data, little_endian, size);
                }
                break;
            case 32:
                {
                    this.address_mask = 0xffffffff;
                    this.data = read32(data, little_endian, size);
                }
                break;
            default: throw new Error(`${bits} is not a supported word length for a Storage device`);
        }
    }
    get_bytes() {
        if (this.data instanceof Uint8Array) {
            return new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength);
        }
        else if (this.data instanceof Uint16Array) {
            return write16(this.data, this.little_endian);
        }
        else if (this.data instanceof Uint32Array) {
            return write32(this.data, this.little_endian);
        }
        else {
            throw new Error(`${this.bits} is not a supported word length for a Storage device`);
        }
    }
    inputs = {
        [IO_Port.ADDR]: this.address_in,
        [IO_Port.PAGE]: this.page_in,
        [IO_Port.BUS]: this.bus_in,
    };
    outputs = {
        [IO_Port.ADDR]: this.address_out,
        [IO_Port.PAGE]: this.page_out,
        [IO_Port.BUS]: this.bus_out,
    };
    data;
    address_mask;
    address = 0;
    address_out(v) {
        this.address = (this.address & ~this.address_mask) | v;
    }
    address_in() {
        return Math.min(2 ** this.bits, this.data.length - (this.address & ~this.address_mask));
    }
    page_out(v) {
        this.address = (this.address & this.address_mask) | (v << this.bits);
    }
    page_in() {
        return Math.ceil(this.data.length / (2 ** this.bits));
    }
    bus_out(v) {
        if (this.address > this.data.length) {
            throw Error(`Storage address out of bounds ${this.address} > ${this.data.length}`);
        }
        this.data[this.address] = v;
    }
    bus_in() {
        if (this.address > this.data.length) {
            throw Error(`Storage address out of bounds ${this.address} > ${this.data.length}`);
        }
        return this.data[this.address];
    }
    reset() {
        // console.log("storage reset");
    }
}
//# sourceMappingURL=storage.js.map