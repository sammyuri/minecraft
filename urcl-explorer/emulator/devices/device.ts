import { IO_Port } from "../instructions";

export type Device_Input = ((callback: (value: number) => void) => void | number) | (() => number);
export type Device_Output = (value: number) => void;
export type Device_Reset = ()=>void;

export interface Device_Host {
    add_io_device(device: Device): void
}

export interface Device {
    inputs?: {[K in IO_Port]?: Device_Input},
    outputs?: {[K in IO_Port]?: Device_Output},
    bits?: number,
    reset?: Device_Reset
}
