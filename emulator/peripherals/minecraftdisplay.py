import tkinter as tk
import math
import time
import random

from emulator.peripherals.triangle_backup import invert

try:
    from .base import Peripheral
    from .textures import textures
except ImportError:
    from base import Peripheral
    from textures import textures


SCREEN_WIDTH = 96
SCREEN_HEIGHT = 64
SCALE = 8
COLOUR = "yellow"
LENS = 896 # 56 * 16
CLIP = 3
operations = 0
faces = 0

def FixedPointNumber(value, bits, precision, signed=False, f=False):
    global operations
    operations += 1
    bitmask = (1 << bits) - 1
    shiftamount = 1 << precision
    value = (math.floor(value * shiftamount) & bitmask)
    if signed and value > 1 << (bits) - 1:
        return (value - (1 << (bits))) / shiftamount
    return value / shiftamount


def world_to_cam(vertex, campos, camdir):
    process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))
    ovx = vertex[0] - campos[0]
    ovy = vertex[1] - campos[1]
    ovz = vertex[2] - campos[2]

    # print(f"X: {process(ovx, 11)}")
    # print(f"Y: {process(ovy, 11)}")
    # print(f"Z: {process(ovz, 11)}")
    # print(f"U: {process(vertex[3], 15)}")
    # print(f"V: {process(vertex[4], 15)}")
    # print()

    vx = FixedPointNumber(camdir[0][0] * ovx + camdir[0][1] * ovy + camdir[0][2] * ovz, 16, 11, signed=True)
    vy = FixedPointNumber(camdir[1][0] * ovx + camdir[1][1] * ovy + camdir[1][2] * ovz, 16, 11, signed=True)
    vz = FixedPointNumber(16 * (camdir[2][0] * ovx + camdir[2][1] * ovy + camdir[2][2] * ovz), 16, 7, signed=True)
    # print(process(camdir[2][0] * ovx, 11))
    # print(process(camdir[2][1] * ovy, 11))
    # print(process(camdir[2][2] * ovz, 11))
    # print(f"VX: {process(vx, 11)}")
    # print(f"VY: {process(vy, 11)}")
    # print(f"VZ: {process(vz, 7)}")
    # print()

    return vx, vy, vz, vertex[3], vertex[4]


def cam_to_screen(vertex):
    process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))
    vx, vy, vz = vertex[0:3]
    invZ = FixedPointNumber(1 / vz, 17, 16)
    persp = FixedPointNumber(LENS * invZ, 16, 6)
    # print(process(persp, 6))
    vx = FixedPointNumber(abs(vx) * persp, 16, 0) * (1 if vx >= 0 else -1)
    vy = FixedPointNumber(abs(vy) * persp, 16, 0) * (1 if vy >= 0 else -1)
    nvx = FixedPointNumber(vx + (SCREEN_WIDTH // 2), 16, 0, signed=True)
    nvy = FixedPointNumber((SCREEN_HEIGHT - 1 - SCREEN_HEIGHT // 2) - vy, 16, 0, signed=True)
    if nvy > 127:
        nvy = 127
    if nvy < -127:
        nvy = -127
    if nvx > 192:
        nvx = 192
    if nvx < -128:
        nvx = -128
    vu = FixedPointNumber(vertex[3] * invZ, 16, 15)
    vv = FixedPointNumber(vertex[4] * invZ, 16, 15)

    return nvx, nvy, invZ, vu, vv


def cull_backface(v1x, v1y, v2x, v2y, v3x, v3y):
    product = (
        FixedPointNumber((v3x - v1x) * (v1y - v2y), 17, 0, signed=True)
        - FixedPointNumber((v1y - v3y) * (v2x - v1x), 17, 0, signed=True)
    )
    return (product < 0)

class MinecraftDisplay(Peripheral):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.root = tk.Tk("Minecraft in Minecraft")
        self.root.geometry(
            str(SCREEN_WIDTH * SCALE)
            + "x"
            + str(SCREEN_HEIGHT * SCALE)
        )

        self.screen = tk.Canvas(
            self.root,
            width=SCREEN_WIDTH * SCALE,
            height=SCALE * SCREEN_HEIGHT
        )
        self.screen.configure(
            bg="#000000",
        )
        self.screen.pack()

        self.var = tk.IntVar()
        self.root.bind("<KeyPress>", self.key_pressed)
        self.root.bind("<Up>", self.key_up)
        self.root.bind("<Down>", self.key_down)
        self.root.bind("<Left>", self.key_left)
        self.root.bind("<Right>", self.key_right)

        self.vertexqueue = []
        self.posqueue = []
        self.texture = 0
        self.scanlines = 0
        self.overallscanlines = 0
        self.scanlinelengths = 0
        self.quads = 0

        self.camerapitch = 0
        self.camerayaw = 0

        self.campos = [4.5, 2.5, 2.25]  # set to 3
        self.recalculate_rotation_matrix()
        self.reset_screen()
        self.buffer()

    def key_up(self, *args):
        self.var.set(5)
    def key_down(self, *args):
        self.var.set(6)
    def key_left(self, *args):
        self.var.set(7)
    def key_right(self, *args):
        self.var.set(8)

    def key_pressed(self, key):
        self.var.set({
            "w": 1,
            "a": 2,
            "s": 3,
            "d": 4,
        }[key.char])

    def recalculate_rotation_matrix(self):
        c = math.pi * 2 * (self.camerapitch / 16)
        b = math.pi * 2 * (self.camerayaw / 16)
        sin = lambda ang: FixedPointNumber(abs(math.sin(ang)), 16, 14) * (1 if math.sin(ang) > 0 else -1)
        cos = lambda ang: FixedPointNumber(abs(math.cos(ang)), 16, 14) * (1 if math.cos(ang) > 0 else -1)
        self.camdir = [
            [cos(c),            0,       sin(c)          ],
            [sin(b) * sin(c),   cos(b),  -sin(b) * cos(c)],
            [-cos(b) * sin(c),  sin(b),  cos(b) * cos(c),],
        ]

        process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))
        for i in range(3):
            self.camdir[i] = list(map(lambda e: FixedPointNumber(abs(e), 16, 6, signed=True) * (1 if e >= 0 else -1), self.camdir[i]))
            print(list(map(lambda e: process(e, 14), self.camdir[i])))

    def reset_screen(self):
        self.zbuffer = [
            [(0, 0) for j in range(SCREEN_WIDTH)] for i in range(SCREEN_HEIGHT)
        ]
        self.set_rectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, "black")

    def set_pixel(self, x, y, colour):
        self.screen.create_rectangle(
            SCALE*x,
            SCALE*y,
            SCALE*(x + 1) - 1,
            SCALE*(y + 1) - 1,
            fill=colour,
            outline=colour,
        )

    def set_rectangle(self, x0, y0, x1, y1, colour):
        self.screen.create_rectangle(
            SCALE*min(x0, x1),
            SCALE*min(y0, y1),
            SCALE*(max(x0, x1) + 1) - 1,
            SCALE*(max(y0, y1) + 1) - 1,
            fill=colour,
            outline=colour,
        )

    def buffer(self):
        self.screen.delete("all")
        totals = 0
        overall = 0
        print()
        print(self.campos)
        for y in range(SCREEN_HEIGHT):
            bitdifferences = 0
            for x in range(SCREEN_WIDTH):
                if x > 0:
                    for bit in range(7):
                        overall += 1
                        bitdifferences += (
                            ((self.zbuffer[y][x - 1][0] >> bit) % 2)
                            ^ ((self.zbuffer[y][x][0] >> bit) % 2)
                        )
                    overall += 1
                    bitdifferences += (
                            ((self.zbuffer[y][x - 1][1]) % 2)
                            ^ ((self.zbuffer[y][x][1]) % 2)
                        )
                self.set_pixel(
                    x, y,
                    COLOUR if self.zbuffer[y][x][1] else "black"
                )
            totals += bitdifferences
        print(f"TOTAL VARIATION: {totals / overall * 100}%")
        print(f"TOTAL SCANLINES: {self.scanlines} OUT OF {self.overallscanlines}")
        print(f"AVERAGE LENGTH: {self.scanlinelengths / max(1, self.scanlines)}")
        print(f"TOTAL QUADRILATERALS: {self.quads}")
        print()
        self.root.update()
        self.scanlines = self.scanlinelengths = self.overallscanlines = self.quads = 0

    def draw_scanline(
        self, y,
        sx, ex,
        sz, ez,
        su, eu,
        sv, ev,
        texture, islast
    ):
        process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))
        # print()
        # print(f"EX: {process(ex, 7)} SX: {process(sx, 7)}")
        # print(f"EU: {process(eu, 15)} SU: {process(su, 15)}")
        # print(f"EZ: {process(ez, 15)} SZ: {process(sz, 15)}")
        # print(f"EV: {process(ev, 15)} SV: {process(sv, 15)}")


        if ex < 0 or sx >= SCREEN_WIDTH:
            return
        if sx > ex:
            ex = sx
        fx = FixedPointNumber(min(0, sx) + (abs(FixedPointNumber(int(sx) - sx, 16, 7, signed=True)) if sx >= 0 else 0), 16, 7, signed=True) * -1
        if int(ex) == int(sx):
            dz = du = dv = 0
            inv = 0
        else:
            if ex - sx >= 1:
                inv = FixedPointNumber(1 / (ex - sx), 17, 16)
            else:
                inv = 0
            ddu, ddus = abs(FixedPointNumber((eu - su), 16, 15, signed=True)), (FixedPointNumber((eu - su), 16, 15, signed=True) < 0)
            du = FixedPointNumber(
                ddu * inv, 24, 23, signed=True
            ) * (-1 if ddus else 1)
            ddu, ddus = abs(FixedPointNumber((ez - sz), 16, 15, signed=True)), (FixedPointNumber((ez - sz), 16, 15, signed=True) < 0)
            dz = FixedPointNumber(
                ddu * inv, 24, 23, signed=True
            ) * (-1 if ddus else 1)
            ddu, ddus = abs(FixedPointNumber((ev - sv), 16, 15, signed=True)), (FixedPointNumber((ev - sv), 16, 15, signed=True) < 0)
            dv = FixedPointNumber(
                ddu * inv, 24, 23, signed=True
            ) * (-1 if ddus else 1)
        u = FixedPointNumber(su + FixedPointNumber(fx * du, 16, 15, signed=True), 16, 15, signed=True)
        v = FixedPointNumber(sv + FixedPointNumber(fx * dv, 16, 15, signed=True), 16, 15, signed=True)
        z = FixedPointNumber(sz + FixedPointNumber(fx * dz, 16, 15, signed=True), 16, 15, signed=True)
        sx = int(sx)
        ex = int(ex)
        if sx <= 0 and ex >= 0:
            self.scanlines += 1
        if sx <= SCREEN_WIDTH // 4 and ex >= SCREEN_WIDTH // 4:
            self.scanlines += 1
        if sx <= SCREEN_WIDTH // 2 and ex >= SCREEN_WIDTH // 2:
            self.scanlines += 1
        if sx <= 3 * SCREEN_WIDTH // 4 and ex >= 3 * SCREEN_WIDTH // 4:
            self.scanlines += 1
        self.overallscanlines += 1
        # if islast:
        #     print(f"U: {process(u, 15)} DU: {process(du, 23)}")
        #     print(f"Z: {process(z, 15)} DZ: {process(dz, 23)}")
        #     print(f"V: {process(v, 15)} DV: {process(dv, 23)}")

        # self.scanlines += 1
        self.scanlinelengths += (ex - sx + 1)
        offset = 1
        def do_16_bit_div(a, b):
            result = 0
            a = 2 * a
            if a - b >= 0:
                a -= b
                result += 0.5
            b = FixedPointNumber(b / 2, 16, 15)
            if a - b >= 0:
                a -= b
                result += 0.25
            b = FixedPointNumber(b / 2, 16, 15)
            if a - b >= 0:
                a -= b
                result += 0.125
            b = FixedPointNumber(b / 2, 16, 15)
            return result
        for x in range(max(0, int(sx)), int(ex) + 1):
            offset += 1
            if 0 <= x < SCREEN_WIDTH:
                t = self.zbuffer[y][x]
                if t[0] <= min(127, int(512 * z)):
                    divu = do_16_bit_div(
                        FixedPointNumber(u + (FixedPointNumber(du, 16, 15, signed=True) - du) * (offset % 2), 16, 15, signed=True),
                        FixedPointNumber(z + (FixedPointNumber(dz, 16, 15, signed=True) - dz) * (offset % 2), 16, 15, signed=True)
                    )
                    divv = do_16_bit_div(
                        FixedPointNumber(v + (FixedPointNumber(dv, 16, 15, signed=True) - dv) * (offset % 2), 16, 15, signed=True),
                        FixedPointNumber(z + (FixedPointNumber(dz, 16, 15, signed=True) - dz) * (offset % 2), 16, 15, signed=True)
                    )
                    a = max(0, min(7, int(8 * divu)))
                    b = max(0, min(7, int(8 * divv)))
                    self.zbuffer[y][x] = (
                        int(min(127, 512 * z)),
                        textures[texture][8 * (7-b) + a]
                    )
            z += dz
            u += du
            v += dv

    def draw_flat_quad(
        self, texture,
        blx, bly, blz, blu, blv,
        tlx, tly, tlz, tlu, tlv,
        brx, bry, brz, bru, brv,
        trx, rty, trz, tru, trv,
        loop,
    ):
        process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))
        if tly == bly:
            invDenom = 0
        else:
            invDenom = FixedPointNumber(1 / (tly - bly), 16, 15)

        bly = int(bly)
        tly = int(tly)
        # if (tly - bly) > 32:
        #     print(blx, brx, bly, tlx, trx, tly)
        # blx = FixedPointNumber(blx, 16, 7, signed=True)
        # brx = FixedPointNumber(brx, 16, 7, signed=True)
        # tlx = FixedPointNumber(tlx, 16, 7, signed=True)
        # trx = FixedPointNumber(trx, 16, 7, signed=True)
        # blu = FixedPointNumber(blu, 16, 15, signed=True)
        # bru = FixedPointNumber(bru, 16, 15, signed=True)
        # tlu = FixedPointNumber(tlu, 16, 15, signed=True)
        # tru = FixedPointNumber(tru, 16, 15, signed=True)
        # blz = FixedPointNumber(blz, 16, 15, signed=True)
        # brz = FixedPointNumber(brz, 16, 15, signed=True)
        # tlz = FixedPointNumber(tlz, 16, 15, signed=True)
        # trz = FixedPointNumber(trz, 16, 15, signed=True)
        # blv = FixedPointNumber(blv, 16, 15, signed=True)
        # brv = FixedPointNumber(brv, 16, 15, signed=True)
        # tlv = FixedPointNumber(tlv, 16, 15, signed=True)
        # trv = FixedPointNumber(trv, 16, 15, signed=True)

        # print(process(trx, 7))
        # print(process(brx, 7))
        # print(process(tlx, 7))
        # print(process(blx, 7))
        # print()
        # print(process(tru, 15))
        # print(process(bru, 15))
        # print(process(tlu, 15))
        # print(process(blu, 15))
        # print()
        # print(process(trz, 15))
        # print(process(brz, 15))
        # print(process(tlz, 15))
        # print(process(blz, 15))
        # print()
        # print(process(trv, 15))
        # print(process(brv, 15))
        # print(process(tlv, 15))
        # print(process(blv, 15))
        # print()

        invmult = lambda t, b, d: FixedPointNumber(FixedPointNumber(abs(t - b), 16, d, signed=True) * invDenom, 16, d) * (-1 if t < b else 1)

        dsx = invmult(tlx, blx, 7)
        dex = invmult(trx, brx, 7)
        dsz = invmult(tlz, blz, 15)
        dez = invmult(trz, brz, 15)
        dsu = invmult(tlu, blu, 15)
        deu = invmult(tru, bru, 15)
        dsv = invmult(tlv, blv, 15)
        dev = invmult(trv, brv, 15)

        sx = FixedPointNumber(blx, 16, 7, signed=True)
        sz = FixedPointNumber(blz, 16, 15, signed=True)
        su = FixedPointNumber(blu, 16, 15, signed=True)
        sv = FixedPointNumber(blv, 16, 15, signed=True)
        ex = FixedPointNumber(brx, 16, 7, signed=True)
        ez = FixedPointNumber(brz, 16, 15, signed=True)
        eu = FixedPointNumber(bru, 16, 15, signed=True)
        ev = FixedPointNumber(brv, 16, 15, signed=True)

        # print("EX", process(ex, 7))
        # print("DEX", process(dex, 7))
        # print("SX", process(sx, 7))
        # print("DSX", process(dsx, 7))
        # print("EU", process(eu, 15))
        # print("DEU", process(deu, 15))
        # print("SU", process(su, 15))
        # print("DSU", process(dsu, 15))
        # print("EZ", process(ez, 15))
        # print("DEZ", process(dez, 15))
        # print("SZ", process(sz, 15))
        # print("DSZ", process(dsz, 15))
        # print("EV", process(ev, 15))
        # print("DEV", process(dev, 15))
        # print("SV", process(sv, 15))
        # print("DSV", process(dsv, 15))

        for y in range(bly, tly + 1):
            # print()
            # print(f"SCANLINE {y - bly}")
            if loop < 2 and y == tly and (tly - bly) > 0:
                continue
            if 0 <= y < SCREEN_HEIGHT:
                self.draw_scanline(
                    y, 
                    sx, ex,
                    sz, ez,
                    su, eu, 
                    sv, ev,
                    texture,
                    (y == tly)
                )
            sx = FixedPointNumber(sx + dsx, 16, 7, signed=True)
            sz = FixedPointNumber(sz + dsz, 16, 15, signed=True)
            su = FixedPointNumber(su + dsu, 16, 15, signed=True)
            sv = FixedPointNumber(sv + dsv, 16, 15, signed=True)
            ex = FixedPointNumber(ex + dex, 16, 7, signed=True)
            ez = FixedPointNumber(ez + dez, 16, 15, signed=True)
            eu = FixedPointNumber(eu + deu, 16, 15, signed=True)
            ev = FixedPointNumber(ev + dev, 16, 15, signed=True)

    def do_full_quad(
        self,
        v1, v2, v3, v4,
    ):
        process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))

        # for i in range(3): print()

        # for i, vertex in enumerate((v1, v2, v3, v4)):
        #     print(f"----- V{i} -----")
        #     print(f"X: {process(vertex[0], 11)}")
        #     print(f"Y: {process(vertex[1], 11)}")
        #     print(f"Z: {process(vertex[2], 7)}")
        #     print(f"U: {process(vertex[3], 15)}")
        #     print(f"V: {process(vertex[4], 15)}")

        v1 = cam_to_screen(v1)
        v2 = cam_to_screen(v2)
        v3 = cam_to_screen(v3)
        v4 = cam_to_screen(v4)

        # for i, vertex in enumerate((v1, v2, v3, v4)):
        #     print(f"----- V{i} -----")
        #     print(vertex[0], vertex[1])
        #     print(f"X: {process(vertex[0], 7)}")
        #     print(f"Y: {process(vertex[1], 0)}")
        #     print(f"U: {process(vertex[3], 15)}")
        #     print(f"Z: {process(vertex[2], 15)}")
        #     print(f"V: {process(vertex[4], 15)}")

        if cull_backface(
            v1[0], v1[1], v2[0], v2[1], v3[0], v3[1]
        ):
            # print("ignore this face")
            return
        if v1[0] > SCREEN_WIDTH and v2[0] > SCREEN_WIDTH and v3[0] > SCREEN_WIDTH and v4[0] > SCREEN_WIDTH:
            # print("ignore this face")
            return
        if v1[0] < 0 and v2[0] < 0 and v3[0] < 0 and v4[0] < 0:
            # print("ignore this face")
            return
        if v1[1] > SCREEN_HEIGHT and v2[1] > SCREEN_HEIGHT and v3[1] > SCREEN_HEIGHT and v4[1] > SCREEN_HEIGHT:
            # print("ignore this face")
            return
        if v1[1] < 0 and v2[1] < 0 and v3[1] < 0 and v4[1] < 0:
            # print("ignore this face")
            return

        highest, highy = 1, v1[1]
        if v2[1] > highy:
            highest, highy = 2, v2[1]
        if v3[1] > highy:
            highest, highy = 3, v3[1]
        if v4[1] > highy:
            highest, highy = 4, v4[1]



        vertices = [v1, v2, v3, v4]
        for i in range(highest - 1):
            vertices = vertices[1:] + vertices[:1]
        left = vertices.copy()[::-1]
        left = left[1:] + left[:1]
        left = left[1:] + left[:1]
        left = left[1:] + left[:1]
        right = vertices.copy()

        currleft = left.pop(0)
        currright = right.pop(0)

        def lerpaty(fromv, tov, at):
            if tov[1] == fromv[1]:
                t = 0
            else:
                invDenom = FixedPointNumber(1 / (fromv[1] - tov[1]), 16, 15)
                assert(invDenom > 0)
                t = FixedPointNumber((fromv[1] - at) * invDenom, 16, 15)
            lerped = []
            def do(fr, to, pre, s):
                e = FixedPointNumber(abs(FixedPointNumber(to - fr, 16, pre, signed=True)) * t, 16, pre) * (1 if to >= fr else -1)
                return FixedPointNumber(fr + e, 16, pre, signed=s)
            lerped.append(do(fromv[0], tov[0], 7, True))
            lerped.append(at)
            lerped.append(do(fromv[2], tov[2], 15, False))
            lerped.append(do(fromv[3], tov[3], 15, False))
            lerped.append(do(fromv[4], tov[4], 15, False))
            return tuple(lerped)

        for loop in range(3):
            boolvalue = (left[-1][1] < right[-1][1])
            fromv = currleft if boolvalue else currright
            tov = left[-1] if boolvalue else right[-1]
            at = right[-1][1] if boolvalue else left[-1][1]
            lerped = lerpaty(fromv, tov, at)

            self.draw_flat_quad(
                self.texture,
                *(lerped if boolvalue else left[-1]),
                *currleft,
                *(right[-1] if boolvalue else lerped),
                *currright,
                loop
            )

            currleft = lerped if boolvalue else left.pop()
            currright = right.pop() if boolvalue else lerped

    def render_quad(
        self,
        v1x, v1y, v1z, v1u, v1v,
        v2x, v2y, v2z, v2u, v2v,
        v3x, v3y, v3z, v3u, v3v,
        v4x, v4y, v4z, v4u, v4v,
    ):
        v1 = world_to_cam(
            (v1x, v1y, v1z, v1u, v1v), self.campos, self.camdir
        )
        v2 = world_to_cam(
            (v2x, v2y, v2z, v2u, v2v), self.campos, self.camdir
        )
        v3 = world_to_cam(
            (v3x, v3y, v3z, v3u, v3v), self.campos, self.camdir
        )
        v4 = world_to_cam(
            (v4x, v4y, v4z, v4u, v4v), self.campos, self.camdir
        )
        # print()
        # print()
        # print()

        if v1[2] < CLIP and v2[2] < CLIP and v3[2] < CLIP and v4[2] < CLIP:
            # print("ignore this face")
            return
        # if v1[2] < 2 or v2[2] < 2 or v3[2] < 2 or v4[2] < 2:
        #     return
        # self.do_full_quad(v1, v2, v3, v4)
        # return

        output = []
        isvisible = lambda v: (v[2] >= CLIP)
        next = [v1, v2, v3, v4]
        prev = v4
        prevvisible = isvisible(prev)

        process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))

        def lerpatz(fromv, tov, at):
            # print("LERPED!!!!!!!!!!!!!!!!!!!!!!1")
            if tov[2] == fromv[2]:
                t = 0
            else:
                invDenom = FixedPointNumber(1 / abs(fromv[2] - tov[2]), 16, 8)
                # print(process(invDenom, 8))
                # print(process(abs(fromv[2] - at), 7))
                t = FixedPointNumber(abs(fromv[2] - at) * invDenom, 16, 15)
                # print(process(t, 15))
            lerped = []
            def do(fr, to, pre, s=True):
                e = FixedPointNumber(FixedPointNumber(abs(to - fr) * t, 16, pre) * (1 if (to >= fr) else -1), 16, pre, signed=s)
                return FixedPointNumber(fr + e, 16, pre, signed=s)
            lerped.append(do(fromv[0], tov[0], 11))
            lerped.append(do(fromv[1], tov[1], 11))
            lerped.append(at)
            lerped.append(do(fromv[3], tov[3], 15))
            lerped.append(do(fromv[4], tov[4], 15))

            # print(f"FROMX: {process(fromv[0], 11)} TOX: {process(tov[0], 11)}")
            # print(f"X: {process(lerped[0], 11)}")
            # print(f"FROMY: {process(fromv[1], 11)} TOY: {process(tov[1], 11)}")
            # print(f"Y: {process(lerped[1], 11)}")
            # print(f"FROMU: {process(fromv[3], 15)} TOU: {process(tov[3], 15)}")
            # print(f"U: {process(lerped[3], 15)}")
            # print(f"FROMV: {process(fromv[4], 15)} TOV: {process(tov[4], 15)}")
            # print(f"V: {process(lerped[4], 15)}")

            return tuple(lerped)

        while len(next) > 0:
            nextvisible = isvisible(next[0])
            if nextvisible ^ prevvisible:
                lerped = lerpatz(prev, next[0], CLIP)
                output.append(lerped)
                prev = lerped
            else:
                prev = next[0]
                if nextvisible:
                    output.append(prev)
                next.pop(0)
            prevvisible = nextvisible
        
        if len(output) == 3:
            self.do_full_quad(output[0], output[1], output[2], output[2])
        elif len(output) == 4:
            # for i in range(5):
            #     for j in range(4):
            #         print(process(output[j][i], (11 if i < 2 else (7 if i == 2 else 15))))
            #     print()
            self.do_full_quad(output[0], output[1], output[2], output[3])
        else:
            self.do_full_quad(output[0], output[1], output[2], output[3])
            self.do_full_quad(output[0], output[3], output[4], output[4])

        

    def send(self, port):
        if port == 64:
            self.root.wait_variable(self.var)
            value = self.var.get()
            self.var.set(0)
            return value

    def receive(self, data, port):
        if port == 64:
            self.posqueue.append(data)
            if len(self.posqueue) == 5:
                vertex = tuple(self.posqueue)
                self.posqueue.clear()
                self.vertexqueue.append(vertex)
                if len(self.vertexqueue) == 6:
                    self.render_quad(
                        *self.vertexqueue[0],
                        *self.vertexqueue[2],
                        *self.vertexqueue[1],
                        *self.vertexqueue[4],
                    )
                    self.vertexqueue.clear()
        elif port == 65:  # set texture
            self.texture = data
            global operations, faces
            #print(operations)
            faces += 1
            #print(faces)
        elif port == 66:  # set camera pitch
            self.camerapitch = data
            self.recalculate_rotation_matrix()
        elif port == 67:  # set camera yaw
            self.camerayaw = data
            self.recalculate_rotation_matrix()
        elif port == 68:  # clear screen
            self.reset_screen()
        elif port == 69:  # buffer
            self.buffer()
            #print(self.camdir)
        elif port == 70:  # set camera x
            self.campos[0] = data / 8 if data < 128 else (data - 256) / 8
        elif port == 71:  # set camera y
            self.campos[1] = data / 8 if data < 128 else (data - 256) / 8
        elif port == 72:  # set camera z
            self.campos[2] = data / 8 if data < 128 else (data - 256) / 8
