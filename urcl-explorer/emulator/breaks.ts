export enum Break {
    ONREAD = 1, ONWRITE = 2,
}
declare const __Break__: unique symbol;
export type BreakFlag<T extends Break = any> = number & {[__Break__]: T};

export function break_flag<T extends Break>(flags: T[]): BreakFlag<T>{
    return flags.reduce((a,b)=>a|b, 0) as any;
}