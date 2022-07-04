import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";
import { Screen } from "./screen.js";

const CLIP = 3;
export const SCREEN_WIDTH = 96;
export const SCREEN_HEIGHT = 64;
const LENS = 56;

export class Amogus implements Device {
    cam = {
        x: 0,
        y: 0,
        z: 0,
        matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        yawIndex: 0,
        pitchIndex: 0
    }
    screen:Screen;
    currentVertex:Vertex = new Vertex();
    quad:Vertex[] = [new Vertex(), new Vertex(), new Vertex(), new Vertex()];
    texture = 0;
    settings = {
        cullBackface: true,
        transparent: false,
        inverted: false,
        overlay: false,
    };
    zbuffer:number[][][] = [];
    constructor(screen:Screen) {
        this.screen = screen;
        this.resetBuffer();
    }
    outputs = {
        [IO_Port.AMOGUS_CAMX]: (i:number) => {
            this.cam.x = i;
        },
        [IO_Port.AMOGUS_CAMY]: (i:number) => {
            this.cam.y = i;
        },
        [IO_Port.AMOGUS_CAMZ]: (i:number) => {
            this.cam.z = i;
        },
        [IO_Port.AMOGUS_CAMROT]: (i:number) => {
            this.cam.matrix = this.CamRotToMatrix(i >> 4, i & 0xF);
        },
        [IO_Port.AMOGUS_VERTX]: (i:number) => {
            this.currentVertex.x = i;
        },
        [IO_Port.AMOGUS_VERTY]: (i:number) => {
            this.currentVertex.y = i;
        },
        [IO_Port.AMOGUS_VERTZ]: (i:number) => {
            this.currentVertex.z = i;
        },
        [IO_Port.AMOGUS_VERTUV]: (i:number) => {
            this.currentVertex.u = (i >> 4) / 8;
            this.currentVertex.v = (i & 0xF) / 8;
        },
        [IO_Port.AMOGUS_TEX]: (i:number) => {
            this.texture = i;
        },
        [IO_Port.AMOGUS_SETTINGS]: (i:number) => {
            this.settings.cullBackface = (i & 0x08) != 0;
            this.settings.transparent = (i & 0x04) != 0;
            this.settings.inverted = (i & 0x02) != 0;
            this.settings.overlay = (i & 0x01) != 0;
        }
    }
    inputs = {
        [IO_Port.AMOGUS_SINYAW]: () => {
            return Math.floor(this.cam.matrix[0][2] * 64);
        },
        [IO_Port.AMOGUS_COSYAW]: () => {
            return Math.floor(this.cam.matrix[0][0] * 64);
        },
        [IO_Port.AMOGUS_CAMDIRX]: () => {
            return Math.floor(this.cam.matrix[2][0] * 64);
        },
        [IO_Port.AMOGUS_CAMDIRY]: () => {
            return Math.floor(this.cam.matrix[2][1] * 64);
        },
        [IO_Port.AMOGUS_CAMDIRZ]: () => {
            return Math.floor(this.cam.matrix[2][2] * 64);
        },
        [IO_Port.AMOGUS_SUBMITVERT]: () => {
            this.quad.shift();
            this.quad.push(this.world_to_cam(this.currentVertex));
            return 0;
        },
        [IO_Port.AMOGUS_DRAWQUAD]: () => {
            this.drawQuad(this.quad);
            return 0;
        },
        [IO_Port.AMOGUS_CLEARBUFFER]: () => {
            this.resetBuffer();
            return 0;
        },
        [IO_Port.AMOGUS_DRAWTOSCREEN]: () => {
            this.drawBufferToScreen();
            return 0;
        }
    }

    drawBufferToScreen() {
        for (let y = 0; y < SCREEN_HEIGHT; y++) {
            for (let x = 0; x < SCREEN_WIDTH; x++) {
                this.screen.buffer[y][x] = this.zbuffer[y][x][1];
            }
        }
    }

    resetBuffer() {
        this.zbuffer = [];
        for(let y = 0; y < SCREEN_HEIGHT; y++) {
            this.zbuffer[y] = [];
            for(let x = 0; x < SCREEN_WIDTH; x++) {
                this.zbuffer[y][x] = [0, 0]; //depth, color
            }
        }
    }

    drawQuad(quad:Vertex[]) {
        if (Textures[this.texture] === undefined) {
            console.log("texture ID [ " + this.texture + " ] does not exist"); //warn if texture doesn't exist
        }

        if (quad[0].z < CLIP && quad[1].z < CLIP && quad[2].z < CLIP && quad[3].z < CLIP) {
            return;
        }

        let output:Vertex[] = [];
        let isvisible = (v:Vertex) => { return v.z >= CLIP };
        let next = [quad[0], quad[1], quad[2], quad[3]];
        let prev = quad[3];
        let prevVisible = isvisible(prev);

        let lerpAtZ = (fromV:Vertex, toV:Vertex, at:number):Vertex => {
            let invDenom:number, lerped:Vertex, t:number;

            if (toV.z === fromV.z) {
                t = 0;
            } else {
                invDenom = this.FixedPointNumber(1 / Math.abs(fromV.z - toV.z), 16, 15);
                t = this.FixedPointNumber(Math.abs(fromV.z - at) * invDenom, 16, 15);
            }

            lerped = new Vertex;

            let _do = (fr:number, to:number, pre:number, s = true) => {
                let e;
                e = this.FixedPointNumber(this.FixedPointNumber(Math.abs(to - fr) * t, 16, pre) * (to >= fr ? 1 : -1), 16, pre, s);
                return this.FixedPointNumber(fr + e, 16, pre, s);
            }

            lerped.x = _do(fromV.x, toV.x, 7);
            lerped.y = _do(fromV.y, toV.y, 7);
            lerped.z = at;
            lerped.u = _do(fromV.u, toV.u, 15);
            lerped.v = _do(fromV.v, toV.v, 15);
            return lerped;
        }

        while (next.length > 0) {
            let lerped:Vertex;
            let nextVisible:boolean = isvisible(next[0]);

            if (nextVisible ? !prevVisible : prevVisible) { //fancy XOR because JS doesn't have XOR.
                lerped = lerpAtZ(prev, next[0], CLIP);
                output.push(lerped);
                prev = lerped;
            } else {
                prev = next[0];

                if (nextVisible) {
                    output.push(prev);
                }

                next.shift();
            }

            prevVisible = nextVisible;
        }

        if (output.length === 3) {
            this.Do_Full_Quad(output[0], output[1], output[2], output[2]);
        } else {
            if (output.length === 4) {
                this.Do_Full_Quad(output[0], output[1], output[2], output[3]);
            } else {
                this.Do_Full_Quad(output[0], output[1], output[2], output[3]);
                this.Do_Full_Quad(output[0], output[3], output[4], output[4]);
            }
        }
    }

    Do_Full_Quad(v1:Vertex, v2:Vertex, v3:Vertex, v4:Vertex) {
        v1 = this.Cam_To_Screen(v1);
        v2 = this.Cam_To_Screen(v2);
        v3 = this.Cam_To_Screen(v3);
        v4 = this.Cam_To_Screen(v4);
        
        if (this.IsBackfacing(v1, v2, v3)) {
            if (this.settings.cullBackface) {
                return
            } else {
                let temp = v2;
                v2 = v4;
                v4 = temp;
            }
        }
        if (v1.x >= SCREEN_WIDTH && v2.x >= SCREEN_WIDTH && v3.x >= SCREEN_WIDTH && v4.x >= SCREEN_WIDTH) {
            return;
        }
        if (v1.x < 0 && v2.x < 0 && v3.x < 0 && v4.x < 0) {
            return;
        }
        if (v1.y >= SCREEN_HEIGHT && v2.y >= SCREEN_HEIGHT && v3.y >= SCREEN_HEIGHT && v4.y >= SCREEN_HEIGHT) {
            return;
        }
        if (v1.y < 0 && v2.y < 0 && v3.y < 0 && v4.y < 0) {
            return;
        }

        let highest = 1, highY = v1.y
        if (v2.y > highY) {
            highest = 2, highY = v2.y;
        }
        if (v3.y > highY) {
            highest = 3, highY = v3.y;
        }
        if (v4.y > highY) {
            highest = 4, highY = v4.y;
        }

        let vertices = [v1, v2, v3, v4];
        for (let i = 0; i < highest; i++) {
            vertices = vertices.slice(1).concat(vertices.slice(0, 1));
        }
        let left = [vertices[2], vertices[1], vertices[0], vertices[3]];
        let right = vertices;

        let currLeft:Vertex = left.pop() as Vertex;
        let currRight:Vertex = right.pop() as Vertex;

        let lerpAtY = (fromV:Vertex, toV:Vertex, at:number) => {
            let invDenom:number, lerped:Vertex, t:number;

            if (toV.y === fromV.y) {
                t = 0;
            } else {
                invDenom = this.FixedPointNumber(1 / (fromV.y - toV.y), 16, 15);

                t = this.FixedPointNumber((fromV.y - at) * invDenom, 16, 15);
            }

            lerped = new Vertex;

            let _do = (fr:number, to:number, pre:number, s:boolean) => {
                let e:number;
                e = this.FixedPointNumber(Math.abs(this.FixedPointNumber(to - fr, 16, pre, true)) * t, 16, pre) * (to >= fr ? 1 : -1);
                return this.FixedPointNumber(fr + e, 16, pre, s);
            }

            lerped.x = _do(fromV.x, toV.x, 7, true);
            lerped.y = at;
            lerped.z = _do(fromV.z, toV.z, 15, false);
            lerped.u = _do(fromV.u, toV.u, 15, false);
            lerped.v = _do(fromV.v, toV.v, 15, false);
            return lerped;
        }

        let at:number, boolValue:boolean, fromV:Vertex | undefined, lerped:Vertex, toV:Vertex;

        for (let loop = 0, _pj_a = 3; loop < _pj_a; loop += 1) {
            boolValue = left.slice(-1)[0].y < right.slice(-1)[0].y;
            fromV = boolValue ? currLeft : currRight;
            toV = boolValue ? left.slice(-1)[0] : right.slice(-1)[0];
            at = boolValue ? right.slice(-1)[0].y : left.slice(-1)[0].y;
            lerped = lerpAtY(fromV, toV, at);
            this.Draw_Flat_Quad(this.texture, (boolValue ? lerped : left.slice(-1)[0]), currLeft, (boolValue ? right.slice(-1)[0] : lerped), currRight, loop);
            currLeft = boolValue ? lerped : left.pop() as Vertex;
            currRight = boolValue ? right.pop() as Vertex : lerped;
        }
    }

    Draw_Flat_Quad(texture:any, bl:Vertex, tl:Vertex, br:Vertex, tr:Vertex, loop:number) {
        let invDenom:number
        if (tl.y == bl.y) {
            invDenom = 0;
        } else {
            invDenom = this.FixedPointNumber(1 / (tl.y - bl.y), 16, 15);
        }

        let bly = Math.floor(bl.y);
        let tly = Math.floor(tl.y);

        let invMult = (t:number, b:number, d:number) => {
            return this.FixedPointNumber(this.FixedPointNumber(Math.abs(t - b), 16, d, true) * invDenom, 16, d) * (t < b ? -1 : 1);
        }

        let dsx = invMult(tl.x, bl.x, 7);
        let dex = invMult(tr.x, br.x, 7);
        let dsz = invMult(tl.z, bl.z, 15);
        let dez = invMult(tr.z, br.z, 15);
        let dsu = invMult(tl.u, bl.u, 15);
        let deu = invMult(tr.u, br.u, 15);
        let dsv = invMult(tl.v, bl.v, 15);
        let dev = invMult(tr.v, br.v, 15);

        let sx = this.FixedPointNumber(bl.x, 16, 7, true)
        let sz = this.FixedPointNumber(bl.z, 16, 15, true)
        let su = this.FixedPointNumber(bl.u, 16, 15, true)
        let sv = this.FixedPointNumber(bl.v, 16, 15, true)
        let ex = this.FixedPointNumber(br.x, 16, 7, true)
        let ez = this.FixedPointNumber(br.z, 16, 15, true)
        let eu = this.FixedPointNumber(br.u, 16, 15, true)
        let ev = this.FixedPointNumber(br.v, 16, 15, true)

        for (let y = bly; y <= tly; y++) {
            if (loop != 0 && y >= tly) {
                continue;
            }
            if (0 <= y && y < SCREEN_HEIGHT) {
                this.Draw_Scanline(
                    y, 
                    sx, ex,
                    sz, ez,
                    su, eu, 
                    sv, ev,
                    texture,
                )
            }
            sx = this.FixedPointNumber(sx + dsx, 16, 7, true)
            sz = this.FixedPointNumber(sz + dsz, 16, 15, true)
            su = this.FixedPointNumber(su + dsu, 16, 15, true)
            sv = this.FixedPointNumber(sv + dsv, 16, 15, true)
            ex = this.FixedPointNumber(ex + dex, 16, 7, true)
            ez = this.FixedPointNumber(ez + dez, 16, 15, true)
            eu = this.FixedPointNumber(eu + deu, 16, 15, true)
            ev = this.FixedPointNumber(ev + dev, 16, 15, true)
        }
    }

    Draw_Scanline(
        y:number,
        sx:number, ex:number,
        sz:number, ez:number,
        su:number, eu:number,
        sv:number, ev:number,
        texture:any
    ) {
        if (ex < 0 || sx >= SCREEN_WIDTH) {
            return;
        }
        if (sx > ex) {
            ex = sx;
        }
        let fx = this.FixedPointNumber(Math.min(0, sx) + (sx >= 0 ? Math.abs(this.FixedPointNumber(Math.floor(sx) - sx, 16, 7, true)) : 0), 16, 7, true) * -1;

        let dz, du, dv, inv;
        if (Math.floor(ex) == Math.floor(sx)) {
            dz = 0, du = 0, dv = 0;
            inv = 0;
        } else {
            if (ex - sx >= 1) {
                inv = this.FixedPointNumber(1 / (ex - sx), 17, 16);
            } else {
                inv = 0;
            }
            let ddu = Math.abs(this.FixedPointNumber((eu - su), 16, 15, true));
            let ddus = (this.FixedPointNumber((eu - su), 16, 15, true) < 0);
            du = this.FixedPointNumber(
                ddu * inv, 24, 23, true
            ) * (ddus ? -1 : 1);
            ddu = Math.abs(this.FixedPointNumber((ez - sz), 16, 15, true));
            ddus = (this.FixedPointNumber((ez - sz), 16, 15, true) < 0);
            dz = this.FixedPointNumber(
                ddu * inv, 24, 23, true
            ) * (ddus ? -1 : 1);
            ddu = Math.abs(this.FixedPointNumber((ev - sv), 16, 15, true));
            ddus = (this.FixedPointNumber((ev - sv), 16, 15, true) < 0);
            dv = this.FixedPointNumber(
                ddu * inv, 24, 23, true
            ) * (ddus ? -1 : 1);
        }
        let u = this.FixedPointNumber(su + this.FixedPointNumber(fx * du, 16, 15, true), 16, 15, true);
        let v = this.FixedPointNumber(sv + this.FixedPointNumber(fx * dv, 16, 15, true), 16, 15, true);
        let z = this.FixedPointNumber(sz + this.FixedPointNumber(fx * dz, 16, 15, true), 16, 15, true);
        sx = Math.floor(sx);
        ex = Math.floor(ex);

        let offset = 1;

        let do_16_bit_div = (a:number, b:number) => {
            let result = 0;
            a = 2 * a;
            if (a - b >= 0) {
                a -= b;
                result += 0.5;
            }
            b = this.FixedPointNumber(b / 2, 16, 15);
            if (a - b >= 0) {
                a -= b
                result += 0.25
            }
            b = this.FixedPointNumber(b / 2, 16, 15)
            if (a - b >= 0) {
                a -= b
                result += 0.125
            }
            b = this.FixedPointNumber(b / 2, 16, 15)
            return result;
        }

        for (let x = Math.max(0, Math.floor(sx)); x < Math.floor(ex) + 1; x++) {
            offset++;
            if (0 <= x && x < SCREEN_WIDTH) {
                let t = this.zbuffer[y][x];
                if (t[0] <= Math.min(127, Math.floor(512 * z))) {
                    let divu = do_16_bit_div(
                        this.FixedPointNumber(u + (this.FixedPointNumber(du, 16, 15, true) - du) * (offset % 2), 16, 15, true),
                        this.FixedPointNumber(z + (this.FixedPointNumber(dz, 16, 15, true) - dz) * (offset % 2), 16, 15, true)
                    );
                    let divv = do_16_bit_div(
                        this.FixedPointNumber(v + (this.FixedPointNumber(dv, 16, 15, true) - dv) * (offset % 2), 16, 15, true),
                        this.FixedPointNumber(z + (this.FixedPointNumber(dz, 16, 15, true) - dz) * (offset % 2), 16, 15, true)
                    );
                    let a = Math.max(0, Math.min(7, Math.floor(8 * divu)));
                    let b = Math.max(0, Math.min(7, Math.floor(8 * divv)));
                    let sampledTexture = Textures[texture] ?? Textures[0];
                    let color = sampledTexture[8 * (7 - b) + a];
                    if (this.settings.transparent && color == 0) {
                        z += dz;
                        u += du;
                        v += dv;
                        continue;
                    }
                    if (this.settings.inverted) {
                        color = color ^ 1;
                    }
                    if (this.settings.overlay) {
                        color = color ^ t[1];
                    }
                    this.zbuffer[y][x] = [
                        Math.floor(Math.min(127, 512 * z)),
                        color
                    ]
                }
            }
            z += dz;
            u += du;
            v += dv;
        }

    }

    IsBackfacing(v1:Vertex, v2:Vertex, v3:Vertex):boolean {
        let crossProduct = (
            this.FixedPointNumber((v3.x - v1.x) * (v1.y - v2.y), 17, 0, true)
            - this.FixedPointNumber((v1.y - v3.y) * (v2.x - v1.x), 17, 0, true)
        );
        return (crossProduct < 0);
    }

    Cam_To_Screen(vertex:Vertex):Vertex {
        let invZ, nvx, nvy, persp, vu, vv, vx, vy, vz;

        vx = vertex.x;
        vy = vertex.y;
        vz = vertex.z;
        invZ = this.FixedPointNumber(1 / vz, 17, 16);
        persp = this.FixedPointNumber(LENS * invZ, 16, 10);
        vx = this.FixedPointNumber(Math.abs(vx) * persp, 16, 0) * (vx >= 0 ? 1 : -1);
        vy = this.FixedPointNumber(Math.abs(vy) * persp, 16, 0) * (vy >= 0 ? 1 : -1);
        nvx = this.FixedPointNumber(vx + Math.floor(SCREEN_WIDTH / 2), 16, 0, true);
        nvy = this.FixedPointNumber(SCREEN_HEIGHT - 1 - Math.floor(SCREEN_HEIGHT / 2) - vy, 16, 0, true);

        if (nvy > 255) {
            nvy = 255;
        }

        if (nvy < -255) {
            nvy = -255;
        }

        if (nvx > 255) {
            nvx = 255;
        }

        if (nvx < -255) {
            nvx = -255;
        }

        vu = this.FixedPointNumber(vertex.u * invZ, 16, 15);
        vv = this.FixedPointNumber(vertex.v * invZ, 16, 15);
        return new Vertex(nvx, nvy, invZ, vu, vv);
    }

    CamRotToMatrix(pitchIndex:number, yawIndex:number):number[][] {
        this.cam.pitchIndex = pitchIndex;
        this.cam.yawIndex = yawIndex;
        let c = Math.PI * 2 * (yawIndex / 16);
        let b = Math.PI * 2 * (pitchIndex / 16);

        let sin = (ang:number) => {
            return this.FixedPointNumber(Math.abs(Math.sin(ang)), 16, 14) * (Math.sin(ang) > 0 ? 1 : -1);
        }

        let cos = (ang:number) => {
            return this.FixedPointNumber(Math.abs(Math.cos(ang)), 16, 14) * (Math.cos(ang) > 0 ? 1 : -1);
        }

        return [
            [cos(c),            0,      sin(c)          ],
            [sin(b) * sin(c),   cos(b), -sin(b) * cos(c)],
            [-cos(b) * sin(c),  sin(b), cos(b) * cos(c) ]
        ];
    }

    world_to_cam(vertex:Vertex) {
        let ovx, ovy, ovz, vx, vy, vz;
      
        ovx = vertex.x - this.cam.x;
        ovy = vertex.y - this.cam.y;
        ovz = vertex.z - this.cam.z;
        vx = this.FixedPointNumber(this.cam.matrix[0][0] * ovx + this.cam.matrix[0][1] * ovy + this.cam.matrix[0][2] * ovz, 16, 7, true );
        vy = this.FixedPointNumber(this.cam.matrix[1][0] * ovx + this.cam.matrix[1][1] * ovy + this.cam.matrix[1][2] * ovz, 16, 7, true );
        vz = this.FixedPointNumber(this.cam.matrix[2][0] * ovx + this.cam.matrix[2][1] * ovy + this.cam.matrix[2][2] * ovz, 16, 7, true );
        return new Vertex(vx, vy, vz, vertex.u, vertex.v);
    }

    FixedPointNumber(value:number, bits:number, precision:number, signed = false, f = false) {
        let bitmask = (1 << bits) - 1;
        let shiftamount = 1 << precision;
        value = Math.floor(value * shiftamount) & bitmask;

        if (signed && value > 1 << (bits - 1)) {
            return (value - (1 << bits)) / shiftamount;
        }

        return value / shiftamount;
    }
}

export enum Texture {
    empty = 0x00, //invert for grass top
    checker = 0x01, //the test texture
    grassSide = 0x02,
    dirt = 0x03, //also grass bottom
    stone = 0x04,
    cobble = 0x05,
    logSide = 0x06,
    logTop = 0x07,
    leaves = 0x08,
    plank = 0x09, //also table bottom
    coalOre = 0x0A,
    ironOre = 0x0B,
    glass = 0x0C,
    saplingLight = 0x0D, //the white pixels in the sapling texture
    saplingDark = 0x0E, //the black pixels in teh sapling texture
    tableSide = 0x0F,
    tableTop = 0x10,
    furnaceSide = 0x11,
    furnaceTop = 0x12,
    furnaceFrontOff = 0x13,
    furnaceFrontOn = 0x14,
    chestSide = 0x15,
    chestTop = 0x16,
    chestFront = 0x17,

    coalItemLight = 0x17,
    coalItemDark = 0x18,

    shadow = 0x19,

    break0 = 0x1A,
    break1 = 0x1B,
    break2 = 0x1C,
    break3 = 0x1D,
    break4 = 0x1E,
    break5 = 0x1F,
    break6 = 0x20,
    break7 = 0x21,
}

export const Textures:any = { //TODO: add remaining textures
    [Texture.empty]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.checker]: [
        1, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 1,
        1, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 1,
        1, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 1,
        1, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 1,
    ],
    [Texture.grassSide]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 1, 0, 0, 0,
        0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 1, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.dirt]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 1, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.stone]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1, 1, 1,
        0, 0, 0, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 0, 0, 0, 1, 1,
    ],
    [Texture.cobble]: [
        0, 1, 0, 0, 1, 0, 1, 1,
        1, 0, 0, 0, 0, 1, 0, 0,
        1, 0, 0, 0, 0, 1, 0, 0, 
        0, 1, 0, 1, 1, 0, 0, 0,
        1, 1, 1, 0, 0, 1, 0, 1,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 0, 1, 0, 0, 0, 1, 0,
        0, 0, 1, 1, 0, 0, 0, 1,
    ],
    [Texture.logSide]: [
        0, 0, 1, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 1, 0, 0,
        0, 1, 0, 0, 0, 1, 0, 0,
        0, 1, 0, 0, 0, 1, 0, 0,
        0, 1, 0, 0, 0, 1, 0, 0,
        0, 0, 1, 0, 0, 1, 0, 0,
        0, 0, 1, 0, 0, 0, 1, 0,
        0, 0, 1, 0, 0, 0, 1, 0,
    ],
    [Texture.logTop]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 1, 1, 0, 1, 0,
        0, 1, 0, 1, 1, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.leaves]: [
        1, 1, 1, 1, 0, 0, 1, 1,
        0, 1, 1, 1, 0, 1, 1, 1,
        1, 0, 1, 0, 0, 1, 1, 1,
        1, 1, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 1, 1, 1, 0, 0,
        1, 1, 0, 0, 1, 1, 1, 0,
        0, 1, 1, 0, 1, 1, 1, 1,
        1, 1, 1, 1, 0, 1, 1, 1,
    ],
    [Texture.plank]: [
        1, 1, 1, 0, 1, 1, 0, 1,
        1, 1, 1, 0, 1, 1, 1, 1,
        1, 1, 1, 0, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 0, 1, 0,
        1, 1, 1, 1, 1, 1, 1, 0,
        1, 0, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.coalOre]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 1, 1,
        1, 1, 1, 1, 0, 1, 1, 1,
        1, 1, 0, 1, 1, 0, 0, 1,
        1, 0, 0, 0, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 1, 1, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.ironOre]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 0, 0, 1,
        1, 1, 0, 0, 0, 0, 1, 1,
        1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 0, 1, 1, 0, 1, 1,
        1, 1, 0, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.glass]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 1, 0, 0, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.saplingLight]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 1, 0, 0, 0,
        1, 1, 0, 0, 0, 0, 1, 1,
        0, 0, 0, 1, 1, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 1,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 0, 1, 1, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 1, 0, 0,
    ],
    [Texture.saplingDark]: [
        0, 0, 0, 1, 1, 0, 0, 0,
        0, 0, 0, 1, 0, 0, 0, 0,
        0, 0, 1, 1, 1, 1, 0, 0,
        0, 1, 1, 0, 0, 1, 1, 0,
        0, 0, 0, 1, 1, 0, 0, 0,
        0, 0, 1, 0, 1, 1, 0, 0,
        0, 0, 0, 0, 0, 1, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.tableSide]: [
        0, 1, 0, 1, 1, 0, 1, 0,
        0, 1, 1, 0, 0, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 1, 0, 0, 1, 0,
        0, 1, 0, 1, 0, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 1, 0,
        0, 1, 0, 1, 0, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
    ],
    [Texture.tableTop]: [
        0, 0, 1, 1, 1, 1, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        1, 1, 0, 0, 0, 0, 1, 1,
        1, 1, 0, 1, 0, 0, 1, 1,
        1, 1, 0, 0, 1, 0, 1, 1,
        1, 1, 0, 0, 0, 0, 1, 1,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 1, 1, 1, 1, 0, 0,
    ],
    [Texture.furnaceSide]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.furnaceTop]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 0,
        0, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 0,
        0, 0, 1, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.furnaceFrontOff]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 0, 0, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.furnaceFrontOn]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 0, 0, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 1, 0, 1, 0,
        0, 1, 0, 1, 1, 0, 1, 0,
        0, 0, 1, 1, 1, 1, 0, 0,
    ],
    [Texture.chestSide]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.chestTop]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.chestFront]: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 0, 0, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 0, 0, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [Texture.break0]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.break1]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 1, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.break2]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 1, 1, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 0, 0, 1, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.break3]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 0, 1, 1, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 1, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.break4]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 0, 1, 1, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 1, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.break5]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 1, 1, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 1, 1,
        1, 0, 0, 1, 0, 1, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.break6]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 1, 0, 0, 1,
        1, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 1, 1, 0, 0, 1, 1,
        1, 1, 0, 0, 1, 0, 1, 1,
        1, 0, 0, 1, 0, 1, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [Texture.break7]: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 1, 1, 0, 1,
        1, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 1, 1, 0, 0, 1, 1,
        1, 1, 0, 0, 1, 0, 1, 1,
        1, 0, 0, 1, 0, 1, 0, 1,
        1, 0, 1, 0, 0, 0, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
}

export class Vertex {
    constructor(x:number = 0, y:number = 0, z:number = 0, u:number = 0, v:number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.u = u;
        this.v = v;
    }
    x = 0;
    y = 0;
    z = 0;
    u = 0;
    v = 0;
};