import { IO_Port } from "../../instructions.js";
const CLIP = 3;
export const SCREEN_WIDTH = 96;
export const SCREEN_HEIGHT = 64;
const LENS = 56;
export class Amogus {
    constructor(screen) {
        this.cam = {
            x: 0,
            y: 0,
            z: 0,
            matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            yawIndex: 0,
            pitchIndex: 0
        };
        this.currentVertex = new Vertex();
        this.quad = [new Vertex(), new Vertex(), new Vertex(), new Vertex()];
        this.texture = 0;
        this.settings = {
            cullBackface: true,
            transparent: false,
            inverted: false,
            overlay: false,
        };
        this.zbuffer = [];
        this.outputs = {
            [IO_Port.AMOGUS_CAMX]: (i) => {
                this.cam.x = i;
            },
            [IO_Port.AMOGUS_CAMY]: (i) => {
                this.cam.y = i;
            },
            [IO_Port.AMOGUS_CAMZ]: (i) => {
                this.cam.z = i;
            },
            [IO_Port.AMOGUS_CAMROT]: (i) => {
                this.cam.matrix = this.CamRotToMatrix(i >> 4, i & 0xF);
            },
            [IO_Port.AMOGUS_VERTX]: (i) => {
                this.currentVertex.x = i;
            },
            [IO_Port.AMOGUS_VERTY]: (i) => {
                this.currentVertex.y = i;
            },
            [IO_Port.AMOGUS_VERTZ]: (i) => {
                this.currentVertex.z = i;
            },
            [IO_Port.AMOGUS_VERTUV]: (i) => {
                this.currentVertex.u = i >> 4;
                this.currentVertex.v = i & 0xF;
            },
            [IO_Port.AMOGUS_TEX]: (i) => {
                this.texture = i;
            },
            [IO_Port.AMOGUS_SETTINGS]: (i) => {
                this.settings.cullBackface = (i & 0x08) != 0;
                this.settings.transparent = (i & 0x04) != 0;
                this.settings.inverted = (i & 0x02) != 0;
                this.settings.overlay = (i & 0x01) != 0;
            }
        };
        this.inputs = {
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
        };
        this.screen = screen;
        this.resetBuffer();
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
        for (let y = 0; y < SCREEN_HEIGHT; y++) {
            this.zbuffer[y] = [];
            for (let x = 0; x < SCREEN_WIDTH; x++) {
                this.zbuffer[y][x] = [0, 0]; //depth, color
            }
        }
    }
    drawQuad(quad) {
        if (Textures[this.texture] === undefined) {
            console.log("texture ID [ " + this.texture + " ] does not exist"); //warn if texture doesn't exist
        }
        if (quad[0].z < CLIP && quad[1].z < CLIP && quad[2].z < CLIP && quad[3].z < CLIP) {
            return;
        }
        let output = [];
        let isvisible = (v) => { return v.z >= CLIP; };
        let next = [quad[0], quad[1], quad[2], quad[3]];
        let prev = quad[3];
        let prevVisible = isvisible(prev);
        let lerpAtZ = (fromV, toV, at) => {
            let invDenom, lerped, t;
            if (toV.z === fromV.z) {
                t = 0;
            }
            else {
                invDenom = this.FixedPointNumber(1 / Math.abs(fromV.z - toV.z), 16, 15);
                t = this.FixedPointNumber(Math.abs(fromV.z - at) * invDenom, 16, 15);
            }
            lerped = new Vertex;
            let _do = (fr, to, pre, s = true) => {
                let e;
                e = this.FixedPointNumber(this.FixedPointNumber(Math.abs(to - fr) * t, 16, pre) * (to >= fr ? 1 : -1), 16, pre, s);
                return this.FixedPointNumber(fr + e, 16, pre, s);
            };
            lerped.x = _do(fromV.x, toV.x, 7);
            lerped.y = _do(fromV.y, toV.y, 7);
            lerped.z = at;
            lerped.u = _do(fromV.u, toV.u, 15);
            lerped.v = _do(fromV.v, toV.v, 15);
            return lerped;
        };
        while (next.length > 0) {
            let lerped;
            let nextVisible = isvisible(next[0]);
            if (nextVisible ? !prevVisible : prevVisible) { //fancy XOR because JS doesn't have XOR.
                lerped = lerpAtZ(prev, next[0], CLIP);
                output.push(lerped);
                prev = lerped;
            }
            else {
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
        }
        else {
            if (output.length === 4) {
                this.Do_Full_Quad(output[0], output[1], output[2], output[3]);
            }
            else {
                this.Do_Full_Quad(output[0], output[1], output[2], output[3]);
                this.Do_Full_Quad(output[0], output[3], output[4], output[4]);
            }
        }
    }
    Do_Full_Quad(v1, v2, v3, v4) {
        v1 = this.Cam_To_Screen(v1);
        v2 = this.Cam_To_Screen(v2);
        v3 = this.Cam_To_Screen(v3);
        v4 = this.Cam_To_Screen(v4);
        if (this.IsBackfacing(v1, v2, v3)) {
            if (this.settings.cullBackface) {
                return;
            }
            else {
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
        let highest = 1, highY = v1.y;
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
        let currLeft = left.pop();
        let currRight = right.pop();
        let lerpAtY = (fromV, toV, at) => {
            let invDenom, lerped, t;
            if (toV.y === fromV.y) {
                t = 0;
            }
            else {
                invDenom = this.FixedPointNumber(1 / (fromV.y - toV.y), 16, 15);
                t = this.FixedPointNumber((fromV.y - at) * invDenom, 16, 15);
            }
            lerped = new Vertex;
            let _do = (fr, to, pre, s) => {
                let e;
                e = this.FixedPointNumber(Math.abs(this.FixedPointNumber(to - fr, 16, pre, true)) * t, 16, pre) * (to >= fr ? 1 : -1);
                return this.FixedPointNumber(fr + e, 16, pre, s);
            };
            lerped.x = _do(fromV.x, toV.x, 7, true);
            lerped.y = at;
            lerped.z = _do(fromV.z, toV.z, 15, false);
            lerped.u = _do(fromV.u, toV.u, 15, false);
            lerped.v = _do(fromV.v, toV.v, 15, false);
            return lerped;
        };
        let at, boolValue, fromV, lerped, toV;
        for (let loop = 0, _pj_a = 3; loop < _pj_a; loop += 1) {
            boolValue = left.slice(-1)[0].y < right.slice(-1)[0].y;
            fromV = boolValue ? currLeft : currRight;
            toV = boolValue ? left.slice(-1)[0] : right.slice(-1)[0];
            at = boolValue ? right.slice(-1)[0].y : left.slice(-1)[0].y;
            lerped = lerpAtY(fromV, toV, at);
            this.Draw_Flat_Quad(this.texture, (boolValue ? lerped : left.slice(-1)[0]), currLeft, (boolValue ? right.slice(-1)[0] : lerped), currRight, loop);
            currLeft = boolValue ? lerped : left.pop();
            currRight = boolValue ? right.pop() : lerped;
        }
    }
    Draw_Flat_Quad(texture, bl, tl, br, tr, loop) {
        let invDenom;
        if (tl.y == bl.y) {
            invDenom = 0;
        }
        else {
            invDenom = this.FixedPointNumber(1 / (tl.y - bl.y), 16, 15);
        }
        let bly = Math.floor(bl.y);
        let tly = Math.floor(tl.y);
        let invMult = (t, b, d) => {
            return this.FixedPointNumber(this.FixedPointNumber(Math.abs(t - b), 16, d, true) * invDenom, 16, d) * (t < b ? -1 : 1);
        };
        let dsx = invMult(tl.x, bl.x, 7);
        let dex = invMult(tr.x, br.x, 7);
        let dsz = invMult(tl.z, bl.z, 15);
        let dez = invMult(tr.z, br.z, 15);
        let dsu = invMult(tl.u, bl.u, 15);
        let deu = invMult(tr.u, br.u, 15);
        let dsv = invMult(tl.v, bl.v, 15);
        let dev = invMult(tr.v, br.v, 15);
        let sx = this.FixedPointNumber(bl.x, 16, 7, true);
        let sz = this.FixedPointNumber(bl.z, 16, 15, true);
        let su = this.FixedPointNumber(bl.u, 16, 15, true);
        let sv = this.FixedPointNumber(bl.v, 16, 15, true);
        let ex = this.FixedPointNumber(br.x, 16, 7, true);
        let ez = this.FixedPointNumber(br.z, 16, 15, true);
        let eu = this.FixedPointNumber(br.u, 16, 15, true);
        let ev = this.FixedPointNumber(br.v, 16, 15, true);
        for (let y = bly; y < tly + 1; y++) {
            if (loop < 2 && y == tly && (tly - bly) > 0) {
                continue;
            }
            if (0 <= y && y < SCREEN_HEIGHT) {
                this.Draw_Scanline(y, sx, ex, sz, ez, su, eu, sv, ev, texture);
            }
            sx = this.FixedPointNumber(sx + dsx, 16, 7, true);
            sz = this.FixedPointNumber(sz + dsz, 16, 15, true);
            su = this.FixedPointNumber(su + dsu, 16, 15, true);
            sv = this.FixedPointNumber(sv + dsv, 16, 15, true);
            ex = this.FixedPointNumber(ex + dex, 16, 7, true);
            ez = this.FixedPointNumber(ez + dez, 16, 15, true);
            eu = this.FixedPointNumber(eu + deu, 16, 15, true);
            ev = this.FixedPointNumber(ev + dev, 16, 15, true);
        }
    }
    Draw_Scanline(y, sx, ex, sz, ez, su, eu, sv, ev, texture) {
        var _a;
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
        }
        else {
            if (ex - sx >= 1) {
                inv = this.FixedPointNumber(1 / (ex - sx), 17, 16);
            }
            else {
                inv = 0;
            }
            let ddu = Math.abs(this.FixedPointNumber((eu - su), 16, 15, true));
            let ddus = (this.FixedPointNumber((eu - su), 16, 15, true) < 0);
            du = this.FixedPointNumber(ddu * inv, 24, 23, true) * (ddus ? -1 : 1);
            ddu = Math.abs(this.FixedPointNumber((ez - sz), 16, 15, true));
            ddus = (this.FixedPointNumber((ez - sz), 16, 15, true) < 0);
            dz = this.FixedPointNumber(ddu * inv, 24, 23, true) * (ddus ? -1 : 1);
            ddu = Math.abs(this.FixedPointNumber((ev - sv), 16, 15, true));
            ddus = (this.FixedPointNumber((ev - sv), 16, 15, true) < 0);
            dv = this.FixedPointNumber(ddu * inv, 24, 23, true) * (ddus ? -1 : 1);
        }
        let u = this.FixedPointNumber(su + this.FixedPointNumber(fx * du, 16, 15, true), 16, 15, true);
        let v = this.FixedPointNumber(sv + this.FixedPointNumber(fx * dv, 16, 15, true), 16, 15, true);
        let z = this.FixedPointNumber(sz + this.FixedPointNumber(fx * dz, 16, 15, true), 16, 15, true);
        sx = Math.floor(sx);
        ex = Math.floor(ex);
        let offset = 1;
        let do_16_bit_div = (a, b) => {
            let result = 0;
            a = 2 * a;
            if (a - b >= 0) {
                a -= b;
                result += 0.5;
            }
            b = this.FixedPointNumber(b / 2, 16, 15);
            if (a - b >= 0) {
                a -= b;
                result += 0.25;
            }
            b = this.FixedPointNumber(b / 2, 16, 15);
            if (a - b >= 0) {
                a -= b;
                result += 0.125;
            }
            b = this.FixedPointNumber(b / 2, 16, 15);
            return result;
        };
        for (let x = Math.max(0, Math.floor(sx)); x < Math.floor(ex) + 1; x++) {
            offset++;
            if (0 <= x && x < SCREEN_WIDTH) {
                let t = this.zbuffer[y][x];
                if (t[0] <= Math.min(127, Math.floor(512 * z))) {
                    let divu = do_16_bit_div(this.FixedPointNumber(u + (this.FixedPointNumber(du, 16, 15, true) - du) * (offset % 2), 16, 15, true), this.FixedPointNumber(z + (this.FixedPointNumber(dz, 16, 15, true) - dz) * (offset % 2), 16, 15, true));
                    let divv = do_16_bit_div(this.FixedPointNumber(v + (this.FixedPointNumber(dv, 16, 15, true) - dv) * (offset % 2), 16, 15, true), this.FixedPointNumber(z + (this.FixedPointNumber(dz, 16, 15, true) - dz) * (offset % 2), 16, 15, true));
                    let a = Math.max(0, Math.min(7, Math.floor(8 * divu)));
                    let b = Math.max(0, Math.min(7, Math.floor(8 * divv)));
                    let sampledTexture = (_a = Textures[texture]) !== null && _a !== void 0 ? _a : Textures[0];
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
                    ];
                }
            }
            z += dz;
            u += du;
            v += dv;
        }
    }
    IsBackfacing(v1, v2, v3) {
        let crossProduct = (this.FixedPointNumber((v3.x - v1.x) * (v1.y - v2.y), 17, 0, true)
            - this.FixedPointNumber((v1.y - v3.y) * (v2.x - v1.x), 17, 0, true));
        return (crossProduct < 0);
    }
    Cam_To_Screen(vertex) {
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
    CamRotToMatrix(pitchIndex, yawIndex) {
        this.cam.pitchIndex = pitchIndex;
        this.cam.yawIndex = yawIndex;
        let c = Math.PI * 2 * (yawIndex / 16);
        let b = Math.PI * 2 * (pitchIndex / 16);
        let sin = (ang) => {
            return this.FixedPointNumber(Math.abs(Math.sin(ang)), 16, 14) * (Math.sin(ang) > 0 ? 1 : -1);
        };
        let cos = (ang) => {
            return this.FixedPointNumber(Math.abs(Math.cos(ang)), 16, 14) * (Math.cos(ang) > 0 ? 1 : -1);
        };
        return [
            [cos(c), 0, sin(c)],
            [sin(b) * sin(c), cos(b), -sin(b) * cos(c)],
            [-cos(b) * sin(c), sin(b), cos(b) * cos(c)]
        ];
    }
    world_to_cam(vertex) {
        let ovx, ovy, ovz, vx, vy, vz;
        ovx = vertex.x - this.cam.x;
        ovy = vertex.y - this.cam.y;
        ovz = vertex.z - this.cam.z;
        vx = this.FixedPointNumber(this.cam.matrix[0][0] * ovx + this.cam.matrix[0][1] * ovy + this.cam.matrix[0][2] * ovz, 16, 7, true);
        vy = this.FixedPointNumber(this.cam.matrix[1][0] * ovx + this.cam.matrix[1][1] * ovy + this.cam.matrix[1][2] * ovz, 16, 7, true);
        vz = this.FixedPointNumber(this.cam.matrix[2][0] * ovx + this.cam.matrix[2][1] * ovy + this.cam.matrix[2][2] * ovz, 16, 7, true);
        return new Vertex(vx, vy, vz, vertex.u, vertex.v);
    }
    FixedPointNumber(value, bits, precision, signed = false, f = false) {
        let bitmask = (1 << bits) - 1;
        let shiftamount = 1 << precision;
        value = Math.floor(value * shiftamount) & bitmask;
        if (signed && value > 1 << (bits - 1)) {
            return (value - (1 << bits)) / shiftamount;
        }
        return value / shiftamount;
    }
}
export var Texture;
(function (Texture) {
    Texture[Texture["empty"] = 0] = "empty";
    Texture[Texture["checker"] = 1] = "checker";
    Texture[Texture["grassSide"] = 2] = "grassSide";
    Texture[Texture["dirt"] = 3] = "dirt";
    Texture[Texture["stone"] = 4] = "stone";
    Texture[Texture["cobble"] = 5] = "cobble";
    Texture[Texture["logSide"] = 6] = "logSide";
    Texture[Texture["logTop"] = 7] = "logTop";
    Texture[Texture["leaves"] = 8] = "leaves";
    Texture[Texture["plank"] = 9] = "plank";
    Texture[Texture["coalOre"] = 10] = "coalOre";
    Texture[Texture["ironOre"] = 11] = "ironOre";
    Texture[Texture["glass"] = 12] = "glass";
    Texture[Texture["saplingLight"] = 13] = "saplingLight";
    Texture[Texture["saplingDark"] = 14] = "saplingDark";
    Texture[Texture["tableSide"] = 15] = "tableSide";
    Texture[Texture["tableTop"] = 16] = "tableTop";
    Texture[Texture["furnaceSide"] = 17] = "furnaceSide";
    Texture[Texture["furnaceTop"] = 18] = "furnaceTop";
    Texture[Texture["furnaceFrontOff"] = 19] = "furnaceFrontOff";
    Texture[Texture["furnaceFrontOn"] = 20] = "furnaceFrontOn";
    Texture[Texture["chestSide"] = 21] = "chestSide";
    Texture[Texture["chestTop"] = 22] = "chestTop";
    Texture[Texture["chestFront"] = 23] = "chestFront";
    Texture[Texture["coalItemLight"] = 23] = "coalItemLight";
    Texture[Texture["coalItemDark"] = 24] = "coalItemDark";
    Texture[Texture["shadow"] = 25] = "shadow";
    Texture[Texture["break0"] = 26] = "break0";
    Texture[Texture["break1"] = 27] = "break1";
    Texture[Texture["break2"] = 28] = "break2";
    Texture[Texture["break3"] = 29] = "break3";
    Texture[Texture["break4"] = 30] = "break4";
    Texture[Texture["break5"] = 31] = "break5";
})(Texture || (Texture = {}));
export const Textures = {
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
    ]
};
export class Vertex {
    constructor(x = 0, y = 0, z = 0, u = 0, v = 0) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.u = 0;
        this.v = 0;
        this.x = x;
        this.y = y;
        this.z = z;
        this.u = u;
        this.v = v;
    }
}
;