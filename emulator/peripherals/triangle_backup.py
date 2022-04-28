import tkinter as tk
import math
import time
import random

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
LENS = 56
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

def invert(a, limit=16):
    b = 1
    result = 0
    offset = 1
    for i in range(limit):
        if b - a >= 0:
            b -= a
            if limit - i <= 16:
                result += offset
        b <<= 1
        if i >= 14:
            b = (b >> (i - 14)) << (i - 14)
        offset /= 2
    return result


def transform_vertex(vertex, campos, camdir):
    ovx = vertex[0] - campos[0]
    ovy = vertex[1] - campos[1]
    ovz = vertex[2] - campos[2]

    vx = FixedPointNumber(camdir[0][0] * ovx + camdir[0][1] * ovy + camdir[0][2] * ovz, 16, 8, signed=True)
    vy = FixedPointNumber(camdir[1][0] * ovx + camdir[1][1] * ovy + camdir[1][2] * ovz, 16, 8, signed=True)
    vz = FixedPointNumber(camdir[2][0] * ovx + camdir[2][1] * ovy + camdir[2][2] * ovz, 16, 10, signed=True)

    if vx > 4:
        print(vx)


    if abs(vz) > 0.01:
        invZ = FixedPointNumber(1 / 16 / vz, 24, 16)
        vx = FixedPointNumber(vx * LENS * 16 * invZ, 24, 0, signed=True)
        vy = FixedPointNumber(vy * LENS * 16 * invZ, 24, 0, signed=True)
        vu = FixedPointNumber(vertex[3] * invZ, 24, 23)
        vv = FixedPointNumber(vertex[4] * invZ, 24, 23)
    else:
        vu = vertex[3]
        vv = vertex[4]

    if vx > 255:
        vx = 255
    if vx < -256:
        vx = -256
    if vy > 255:
        vy = 255
    if vy < -256:
        vy = -256

    return int(vx + SCREEN_WIDTH // 2), 63 - int(vy + SCREEN_HEIGHT // 2), vz, vu, vv


def cull_backface(v1x, v1y, v2x, v2y, v3x, v3y):
    product = (
        FixedPointNumber((v2x - v1x) * (v3y - v1y), 24, 0, signed=True)
        - FixedPointNumber((v2y - v1y) * (v3x - v1x), 24, 0, signed=True)
    )
    return (product <= 0)

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
        self.scanlinelengths = 0

        self.camerapitch = 0
        self.camerayaw = 0

        self.campos = [4.75, 3, 1]
        self.recalculate_rotation_matrix()
        self.reset_screen()
        self.buffer()

        # self.render_triangle(
        #     2, 0, 2, 0, 0,
        #     6, 0, 2, 0, 1,
        #     6, 4, 2, 1, 1,
        # )

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
        b = math.pi * 2 * (self.camerapitch / 16)
        c = math.pi * 2 * (self.camerayaw / 16)
        sin = lambda ang: math.sin(ang)
        cos = lambda ang: math.cos(ang)
        self.camdir = [
            [
                cos(b),
                sin(b) * sin(c),
                sin(b) * cos(c),
            ],
            [
                0,
                cos(c),
                -sin(c),
            ],
            [
                -sin(b),
                cos(b) * sin(c),
                cos(b) * cos(c),
            ]
        ]

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
        for y in range(SCREEN_HEIGHT):
            bitdifferences = 0
            for x in range(SCREEN_WIDTH):
                if x > 0:
                    for bit in range(7):
                        bitdifferences += (
                            ((self.zbuffer[y][x - 1][0] >> bit) & 1)
                            ^ ((self.zbuffer[y][x][0] >> bit) & 1)
                        )
                    bitdifferences += (
                            ((self.zbuffer[y][x - 1][1]) & 1)
                            ^ ((self.zbuffer[y][x][1]) & 1)
                        )
                self.set_pixel(
                    x, y,
                    COLOUR if self.zbuffer[y][x][1] else "black"
                )
            totals += bitdifferences
        print(f"TOTAL SCANLINES: {self.scanlines}")
        print(f"AVERAGE LENGTH: {self.scanlinelengths / max(1, self.scanlines)}")
        self.root.update()
        self.scanlines = self.scanlinelengths = 0

    def draw_scanline(
        self, y,
        sx, ex,
        sz, ez,
        su, eu,
        sv, ev,
        texture
    ):
        if ex < 0 or sx >= SCREEN_WIDTH:
            return
        fx = FixedPointNumber(min(0, sx) + (abs(FixedPointNumber(int(sx) - sx, 16, 7, signed=True)) if sx >= 0 else 0), 16, 7, signed=True) * -1
        process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), max(d + 1, 16), d))))[2:].zfill(max(16, d + 1))
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
        global fullprint
        if fullprint:
            print(f"EX - SX: {process(ex - sx, 7)}")
            print(f"INV: {process(inv, 15)}")
            print(f"Z: {process(z, 15)}")
            print(f"U: {process(u, 15)}")
            print(f"V: {process(v, 15)}")
            print(f"DZ: {process(dz, 23)}")
            print(f"DU: {process(du, 23)}")
            print(f"DV: {process(dv, 23)}")
        sx = int(sx)
        ex = int(ex)
        self.scanlines += 1
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
                if t[0] < min(127, int(512 * z)):
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
    ):
        if tly == bly:
            invDenom = 0
        else:
            invDenom = FixedPointNumber(1 / (tly - bly), 16, 15)
        bly = int(bly)
        tly = int(tly)
        blx = FixedPointNumber(blx, 16, 7, signed=True)
        brx = FixedPointNumber(brx, 16, 7, signed=True)
        tlx = FixedPointNumber(tlx, 16, 7, signed=True)
        trx = FixedPointNumber(trx, 16, 7, signed=True)
        blu = FixedPointNumber(blu, 16, 15, signed=True)
        bru = FixedPointNumber(bru, 16, 15, signed=True)
        tlu = FixedPointNumber(tlu, 16, 15, signed=True)
        tru = FixedPointNumber(tru, 16, 15, signed=True)
        blz = FixedPointNumber(blz, 16, 15, signed=True)
        brz = FixedPointNumber(brz, 16, 15, signed=True)
        tlz = FixedPointNumber(tlz, 16, 15, signed=True)
        trz = FixedPointNumber(trz, 16, 15, signed=True)
        blv = FixedPointNumber(blv, 16, 15, signed=True)
        brv = FixedPointNumber(brv, 16, 15, signed=True)
        tlv = FixedPointNumber(tlv, 16, 15, signed=True)
        trv = FixedPointNumber(trv, 16, 15, signed=True)

        invmult = lambda t, b, d: FixedPointNumber(abs(FixedPointNumber(t - b, 16, d, signed=True)) * invDenom, 16, d) * (-1 if t < b else 1)

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

        process = lambda e, d: ("-" if e < 0 else "") + str(bin(int((1 << d) * FixedPointNumber(abs(e), 16, d))))[2:].zfill(max(16, d + 1))
        global fullprint
        if fullprint and False:
            print(f"TRX: {process(trx, 7)}")
            print(f"BRX: {process(brx, 7)}")
            print(f"TLX: {process(tlx, 7)}")
            print(f"BLX: {process(blx, 7)}")
            print(f"TRU: {process(tru, 15)}")
            print(f"BRU: {process(bru, 15)}")
            print(f"TLU: {process(tlu, 15)}")
            print(f"BLU: {process(blu, 15)}")
            print(f"TRZ: {process(trz, 15)}")
            print(f"BRZ: {process(brz, 15)}")
            print(f"TLZ: {process(tlz, 15)}")
            print(f"BLZ: {process(blz, 15)}")
            print(f"TRV: {process(trv, 15)}")
            print(f"BRV: {process(brv, 15)}")
            print(f"TLV: {process(tlv, 15)}")
            print(f"BLV: {process(blv, 15)}")
            print("----------")
            print(f"BLY: {process(bly, 0)}")
            print(f"TLY: {process(tly, 0)}")
            print(f"DY: {process(tly - bly, 7)}")
            print(f"invDenom: {process(invDenom, 15)}")
            print(f"EX: {process(ex, 7)}")
            print(f"DEX: {process(dex, 7)}")
            print(f"SX: {process(sx, 7)}")
            print(f"DSX: {process(dsx, 7)}")
            print(f"EU: {process(eu, 15)}")
            print(f"DEU: {process(deu, 15)}")
            print(f"SU: {process(su, 15)}")
            print(f"DSU: {process(dsu, 15)}")
            print(f"EZ: {process(ez, 15)}")
            print(f"DEZ: {process(dez, 15)}")
            print(f"SZ: {process(sz, 15)}")
            print(f"DSZ: {process(dsz, 15)}")
            print(f"EV: {process(ev, 15)}")
            print(f"DEV: {process(dev, 15)}")
            print(f"SV: {process(sv, 15)}")
            print(f"DSV: {process(dsv, 15)}")

        for y in range(bly, tly + 1):
            if fullprint:
                print("----------")
                print(f"EX: {process(ex, 7)}")
                print(f"SX: {process(sx, 7)}")
                print(f"EU: {process(eu, 15)}")
                print(f"SU: {process(su, 15)}")
                print(f"EZ: {process(ez, 15)}")
                print(f"SZ: {process(sz, 15)}")
                print(f"EV: {process(ev, 15)}")
                print(f"SV: {process(sv, 15)}")
            if 0 <= y < SCREEN_HEIGHT:
                self.draw_scanline(
                    y, 
                    sx, ex,
                    sz, ez,
                    su, eu, 
                    sv, ev,
                    texture
                )
            sx = FixedPointNumber(sx + dsx, 16, 7, signed=True)
            sz = FixedPointNumber(sz + dsz, 16, 15, signed=True)
            su = FixedPointNumber(su + dsu, 16, 15, signed=True)
            sv = FixedPointNumber(sv + dsv, 16, 15, signed=True)
            ex = FixedPointNumber(ex + dex, 16, 7, signed=True)
            ez = FixedPointNumber(ez + dez, 16, 15, signed=True)
            eu = FixedPointNumber(eu + deu, 16, 15, signed=True)
            ev = FixedPointNumber(ev + dev, 16, 15, signed=True)



    # def draw_flat_bottom_tri(
    #     self, texture,
    #     ax, ay, az, au, av,
    #     bx, by, bz, bu, bv,
    #     cx, cy, cz, cu, cv,
    # ):
    #     self.draw_flat_quad(
    #         texture,
    #         ax, ay, az, au, av,
    #         cx, cy, cz, cu, cv,
    #         bx, by, bz, bu, bv,
    #         cx, cy, cz, cu, cv,
    #     )

    # def draw_flat_top_tri(
    #     self, texture,
    #     ax, ay, az, au, av,
    #     bx, by, bz, bu, bv,
    #     cx, cy, cz, cu, cv,
    # ):
    #     self.draw_flat_quad(
    #         texture,
    #         ax, ay, az, au, av,
    #         bx, by, bz, bu, bv,
    #         ax, ay, az, au, av,
    #         cx, cy, cz, cu, cv,
    #     )

    # def draw_full_tri(
    #     self, texture,
    #     ax, ay, az, au, av,
    #     bx, by, bz, bu, bv,
    #     cx, cy, cz, cu, cv,
    # ):
    #     cy = int(cy)
    #     by = int(by)
    #     ay = int(ay)
    #     t = FixedPointNumber((by - ay) / (cy - ay), 16, 15)
    #     dx = FixedPointNumber((cx - ax) * t + ax, 16, 6, signed=True)
    #     dy = by
    #     dz = FixedPointNumber((cz - az) * t + az, 16, 15, signed=True)
    #     du = FixedPointNumber((cu - au) * t + au, 16, 15, signed=True)
    #     dv = FixedPointNumber((cv - av) * t + av, 16, 15, signed=True)
    #     if dx > bx:
    #         dx, dy, dz, du, dv, bx, by, bz, bu, bv = (
    #             bx, by, bz, bu, bv, dx, dy, dz, du, dv
    #         )
    #     self.draw_flat_bottom_tri(
    #         texture,
    #         dx, dy, dz, du, dv,
    #         bx, by, bz, bu, bv,
    #         cx, cy, cz, cu, cv,
    #     )
    #     self.draw_flat_top_tri(
    #         texture,
    #         ax, ay, az, au, av,
    #         dx, dy, dz, du, dv,
    #         bx, by, bz, bu, bv,
    #     )

    def render_quad(
        self,
        v1x, v1y, v1z, v1u, v1v,
        v2x, v2y, v2z, v2u, v2v,
        v3x, v3y, v3z, v3u, v3v,
        v4x, v4y, v4z, v4u, v4v,
    ):
        v1 = transform_vertex(
            (v1x, v1y, v1z, v1u, v1v), self.campos, self.camdir
        )
        v2 = transform_vertex(
            (v2x, v2y, v2z, v2u, v2v), self.campos, self.camdir
        )
        v3 = transform_vertex(
            (v3x, v3y, v3z, v3u, v3v), self.campos, self.camdir
        )
        v4 = transform_vertex(
            (v4x, v4y, v4z, v4u, v4v), self.campos, self.camdir
        )

        if cull_backface(
            v1[0], 63 - v1[1], v3[0], 63 - v3[1], v2[0], 63 - v2[1]
        ):
            return
        if v1[2] < 0.125 or v2[2] < 0.125 or v3[2] < 0.125 or v4[2] < 0.125:
            return

        highest, highy = 1, v1[1]
        if v2[1] > highy:
            highest, highy = 2, v2[1]
        if v3[1] > highy:
            highest, highy = 3, v3[1]
        if v4[1] > highy:
            highest, highy = 4, v4[1]

        vertices = [v1, v2, v3, v4]
        for i, v in enumerate(vertices):
            vertices[i] = (
                v[0],
                v[1],
                FixedPointNumber(1 / 16 / v[2], 16, 15),
                v[3],
                v[4]
            )
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
                t = FixedPointNumber((at - fromv[1]) / (tov[1] - fromv[1]), 16, 15, signed=True)
            lerped = []
            lerped.append(FixedPointNumber(fromv[0] + (tov[0] - fromv[0]) * t, 16, 7, signed=True))
            lerped.append(at)
            lerped.append(FixedPointNumber(fromv[2] + (tov[2] - fromv[2]) * t, 16, 15, signed=True))
            lerped.append(FixedPointNumber(fromv[3] + (tov[3] - fromv[3]) * t, 16, 15, signed=True))
            lerped.append(FixedPointNumber(fromv[4] + (tov[4] - fromv[4]) * t, 16, 15, signed=True))
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
            )

            currleft = lerped if boolvalue else left.pop()
            currright = right.pop() if boolvalue else lerped


    # def render_triangle(
    #     self,
    #     v1x, v1y, v1z, v1u, v1v,
    #     v2x, v2y, v2z, v2u, v2v,
    #     v3x, v3y, v3z, v3u, v3v,
    # ):
    #     v1 = transform_vertex(
    #         (v1x, v1y, v1z, v1u, v1v), self.campos, self.camdir
    #     )
    #     v2 = transform_vertex(
    #         (v2x, v2y, v2z, v2u, v2v), self.campos, self.camdir
    #     )
    #     v3 = transform_vertex(
    #         (v3x, v3y, v3z, v3u, v3v), self.campos, self.camdir
    #     )
    #     if cull_backface(
    #         v1[0], 63 - v1[1], v2[0], 63 - v2[1], v3[0], 63 - v3[1]
    #     ):
    #         return
    #     vertices = list(sorted(
    #         [v1, v2, v3],
    #         key=lambda vertex: vertex[1]
    #     ))
    #     v1, v2, v3 = vertices
    #     if v1[0] > SCREEN_WIDTH and v2[0] > SCREEN_WIDTH and v3[0] > SCREEN_WIDTH:
    #         return
    #     if v1[0] < 0 and v2[0] < 0 and v3[0] < 0:
    #         return
    #     if v1[1] > SCREEN_HEIGHT and v2[1] > SCREEN_HEIGHT and v3[1] > SCREEN_HEIGHT:
    #         return
    #     if v1[1] < 0 and v2[1] < 0 and v3[1] < 0:
    #         return
    #     if v1[2] < 0.125 or v2[2] < 0.125 or v3[2] < 0.125:
    #         return
    #     for i, v in enumerate(vertices):
    #         vertices[i] = (
    #             v[0],
    #             v[1],
    #             FixedPointNumber(1 / 16 / v[2], 16, 15),
    #             v[3],
    #             v[4]
    #         )
    #     v1, v2, v3 = vertices
    #     if vertices[0][1] == vertices[1][1] == vertices[2][1]:
    #         vertices = list(sorted(
    #             [v1, v2, v3],
    #             key=lambda vertex: vertex[0]
    #         ))
    #         self.draw_scanline(
    #             vertices[0][1],
    #             vertices[0][0], vertices[2][0],
    #             vertices[0][2], vertices[2][2],
    #             vertices[0][3], vertices[2][3],
    #             vertices[0][4], vertices[2][4],
    #             self.texture,
    #         )
    #     elif vertices[0][1] == vertices[1][1]:
    #         base = list(sorted(
    #             [v1, v2],
    #             key=lambda vertex: vertex[0]
    #         ))
    #         self.draw_flat_bottom_tri(
    #             self.texture,
    #             *base[0],
    #             *base[1],
    #             *v3,
    #         )
    #     elif vertices[1][1] == vertices[2][1]:
    #         base = list(sorted(
    #             [v2, v3],
    #             key=lambda vertex: vertex[0]
    #         ))
    #         self.draw_flat_top_tri(
    #             self.texture,
    #             *v1,
    #             *base[0],
    #             *base[1],
    #         )
    #     else:
    #         self.draw_full_tri(
    #             self.texture,
    #             *v1,
    #             *v2,
    #             *v3,
    #         )

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





if __name__ == "__main__":
    fullprint = True
    disp = MinecraftDisplay(0, 1)
    disp.texture = 11
    disp.render_triangle(5, 3, 2, 1, 0, 5, 4, 2, 1, 1, 4, 4, 3, 0, 1)
    disp.render_triangle(4, 3, 3, 0, 0, 5, 3, 2, 1, 0, 4, 4, 3, 0, 1)
    disp.buffer()
    time.sleep(10000)
else:
    fullprint = False