from base import Peripheral
from ports import IO_Port
from screen import Screen

from enum import Enum
import math

CLIP = 3
SCREEN_WIDTH = 96
SCREEN_HEIGHT = 64
LENS = 56

def FixedPointNumber(value:float, bits:int, precision:int, signed = False, f = False):
    bitmask = (1 << bits) - 1
    shiftamount = 1 << precision
    value = math.floor(value * shiftamount) & bitmask

    if (signed and value > 1 << (bits - 1)):
        return (value - (1 << bits)) / shiftamount

    return value / shiftamount

class Vertex:
    def __init__(self, x = 0, y = 0, z = 0, u = 0, v = 0):
        self.x = x
        self.y = y
        self.z = z
        self.u = u
        self.v = v

class Texture(Enum):
    empty = 0x00 #invert for grass top
    checker = 0x01 #the test texture
    grassSide = 0x02
    dirt = 0x03 #also grass bottom
    stone = 0x04
    cobble = 0x05
    logSide = 0x06
    logTop = 0x07
    leaves = 0x08
    plank = 0x09 #also table bottom
    coalOre = 0x0A
    ironOre = 0x0B
    glass = 0x0C
    saplingLight = 0x0D #the white pixels in the sapling texture
    saplingDark = 0x0E #the black pixels in teh sapling texture
    tableSide = 0x0F
    tableTop = 0x10
    furnaceSide = 0x11
    furnaceTop = 0x12
    furnaceFrontOff = 0x13
    furnaceFrontOn = 0x14
    chestSide = 0x15
    chestTop = 0x16
    chestFront = 0x17

    coalItemLight = 0x17
    coalItemDark = 0x18

    shadow = 0x19

    break0 = 0x1A
    break1 = 0x1B
    break2 = 0x1C
    break3 = 0x1D
    break4 = 0x1E
    break5 = 0x1F

Textures = { #TODO: add remaining textures
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
}

class Amogus(Peripheral):

    def __init__(self, screen:Screen, port:int, portrange:int = 1):
        super().__init__(port, portrange)

        self.cam = {
            ["pos"]: [0, 0, 0],
            ["matrix"]: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            ["rotation"]: [0, 0]
        }
        self.display:Screen = screen
        self.currentVertex:Vertex = Vertex()
        self.quad:list[Vertex] = [Vertex(), Vertex(), Vertex(), Vertex()]
        self.texture:Texture = Texture.empty
        self.settings = {
            ["cullBackface"]: True,
            ["transparent"]: False,
            ["inverted"]: False,
            ["overlay"]: False,
        }
        self.zbuffer:list[list[list[int]]] = []
    
    def recieve(self, data:int, port:IO_Port):
        if (port == IO_Port.AMOGUS_CAMX):
            self.cam["pos"][0] = data
        elif (port == IO_Port.AMOGUS_CAMY):
            self.cam["pos"][1] = data
        elif (port == IO_Port.AMOGUS_CAMZ):
            self.cam["pos"][2] = data
        elif (port == IO_Port.AMOGUS_CAMROT):
            self.cam["matrix"] = self.CamRotToMatrix(data >> 4, data & 0xF)
        elif (port == IO_Port.AMOGUS_VERTX):
            self.currentVertex.x = data
        elif (port == IO_Port.AMOGUS_VERTY):
            self.currentVertex.y = data
        elif (port == IO_Port.AMOGUS_VERTZ):
            self.currentVertex.z = data
        elif (port == IO_Port.AMOGUS_VERTUV):
            self.currentVertex.u = data >> 4
            self.currentVertex.v = data & 0xF
        elif (port == IO_Port.AMOGUS_TEX):
            self.texture = data
        elif (port == IO_Port.AMOGUS_SETTINGS):
            self.settings["cullBackface"] = (data & 0x08) != 0
            self.settings["transparent"] = (data & 0x04) != 0
            self.settings["inverted"] = (data & 0x02) != 0
            self.settings["overlay"] = (data & 0x01) != 0
    
    def send(self, port:IO_Port):
        if (port == IO_Port.AMOGUS_SINYAW):
            return math.floor(-math.sin(math.pi * 2 * self.cam["rotation"][0] / 16) * 64)
        elif (port == IO_Port.AMOGUS_COSYAW):
            return math.floor(math.cos(math.pi * 2 * self.cam["rotation"][0] / 16) * 64)
        elif (port == IO_Port.AMOGUS_CAMDIRX):
            return math.floor(self.cam["matrix"][2][0] * 64)
        elif (port == IO_Port.AMOGUS_CAMDIRY):
            return math.floor(self.cam["matrix"][2][1] * 64)
        elif (port == IO_Port.AMOGUS_CAMDIRZ):
            return math.floor(self.cam["matrix"][2][2] * 64)
        elif (port == IO_Port.AMOGUS_SUBMITVERT):
            self.quad.pop(0)
            self.quad.append(self.world_to_cam(self.currentVertex))
            return 0
        elif (port == IO_Port.AMOGUS_DRAWQUAD):
            self.drawQuad(self.quad)
            return 0
        elif (port == IO_Port.AMOGUS_CLEARBUFFER):
            self.resetBuffer()
            return 0
        elif (port == IO_Port.AMOGUS_DRAWTOSCREEN):
            self.drawBufferToScreen()
            return 0
    
    def drawBufferToScreen(self):
        # self.screen
        pass
        # TODO: drawBufferToScreen
    
    def resetBuffer(self):
        self.zbuffer = []
        for y in range(SCREEN_HEIGHT):
            self.zbuffer[y] = []
            for x in range(SCREEN_WIDTH):
                self.zbuffer[y][x] = [0, 0] #depth, color
    
    def drawQuad(self, quad:list[Vertex]):
        if (not Textures[self.texture]):
            print("texture ID [ " + self.texture + " ] does not exist") #warn if texture doesn't exist

        if (quad[0].z < CLIP and quad[1].z < CLIP and quad[2].z < CLIP and quad[3].z < CLIP):
            return

        output:list[Vertex] = []
        def isvisible(v:Vertex) -> bool:
            return v.z >= CLIP
        next = [quad[0], quad[1], quad[2], quad[3]]
        prev = quad[3]
        prevVisible = isvisible(prev)

        def lerpAtZ(fromV:Vertex, toV:Vertex, at:float) -> Vertex:
            invDenom:float = 0
            t:float = 0

            if (toV.z == fromV.z):
                t = 0
            else:
                invDenom = FixedPointNumber(1 / abs(fromV.z - toV.z), 16, 15)
                t = FixedPointNumber(abs(fromV.z - at) * invDenom, 16, 15)

            lerped = Vertex()

            def _do(fr:float, to:float, pre:float, s:bool = True):
                e = FixedPointNumber(FixedPointNumber(abs(to - fr) * t, 16, pre) * (1 if to >= fr else -1), 16, pre, s)
                return FixedPointNumber(fr + e, 16, pre, s)

            lerped.x = _do(fromV.x, toV.x, 7)
            lerped.y = _do(fromV.y, toV.y, 7)
            lerped.z = at
            lerped.u = _do(fromV.u, toV.u, 15)
            lerped.v = _do(fromV.v, toV.v, 15)
            return lerped

        while (len(next) > 0):
            lerped = Vertex()
            nextVisible:bool = isvisible(next[0])

            if (nextVisible ^ prevVisible):
                lerped = lerpAtZ(prev, next[0], CLIP)
                output.push(lerped)
                prev = lerped
            else:
                prev = next[0]

                if (nextVisible):
                    output.append(prev)

                next.pop(0)

            prevVisible = nextVisible

        if (output.length == 3):
            self.Do_Full_Quad(output[0], output[1], output[2], output[2])
        else:
            if (output.length == 4):
                self.Do_Full_Quad(output[0], output[1], output[2], output[3])
            else:
                self.Do_Full_Quad(output[0], output[1], output[2], output[3])
                self.Do_Full_Quad(output[0], output[3], output[4], output[4])

    def Do_Full_Quad(self, v1:Vertex, v2:Vertex, v3:Vertex, v4:Vertex):
        v1 = self.Cam_To_Screen(v1)
        v2 = self.Cam_To_Screen(v2)
        v3 = self.Cam_To_Screen(v3)
        v4 = self.Cam_To_Screen(v4)
        
        if (self.IsBackfacing(v1, v2, v3)):
            if (self.settings["cullBackface"]):
                return
            else:
                temp = v2
                v2 = v4
                v4 = temp
        
        if (v1.x >= SCREEN_WIDTH and v2.x >= SCREEN_WIDTH and v3.x >= SCREEN_WIDTH and v4.x >= SCREEN_WIDTH):
            return
        if (v1.x < 0 and v2.x < 0 and v3.x < 0 and v4.x < 0):
            return
        if (v1.y >= SCREEN_HEIGHT and v2.y >= SCREEN_HEIGHT and v3.y >= SCREEN_HEIGHT and v4.y >= SCREEN_HEIGHT):
            return
        if (v1.y < 0 and v2.y < 0 and v3.y < 0 and v4.y < 0):
            return

        highest = 1
        highY = v1.y

        if (v2.y > highY):
            highest = 2
            highY = v2.y
        if (v3.y > highY):
            highest = 3
            highY = v3.y
        if (v4.y > highY):
            highest = 4
            highY = v4.y

        vertices = [v1, v2, v3, v4]
        for i in range(highest):
            vertices = vertices[1:] + vertices[:1]
        left:list[Vertex] = [vertices[2], vertices[1], vertices[0], vertices[3]]
        right:list[Vertex] = vertices

        currLeft:Vertex = left.pop()
        currRight:Vertex = right.pop()

        def lerpAtY (fromV:Vertex, toV:Vertex, at:float):
            invDenom = 0
            t = 0

            if (toV.y == fromV.y):
                t = 0
            else:
                invDenom = FixedPointNumber(1 / (fromV.y - toV.y), 16, 15)

                t = FixedPointNumber((fromV.y - at) * invDenom, 16, 15)

            lerped = Vertex()

            def _do(fr:float, to:float, pre:float, s:bool):
                e = FixedPointNumber(abs(FixedPointNumber(to - fr, 16, pre, True)) * t, 16, pre) * (1 if to >= fr else -1)
                return FixedPointNumber(fr + e, 16, pre, s)

            lerped.x = _do(fromV.x, toV.x, 7, True)
            lerped.y = at
            lerped.z = _do(fromV.z, toV.z, 15, False)
            lerped.u = _do(fromV.u, toV.u, 15, False)
            lerped.v = _do(fromV.v, toV.v, 15, False)
            return lerped

        for loop in range(3):
            boolValue = left[-1].y < right[-1].y
            fromV = currLeft if boolValue else currRight
            toV = left[-1] if boolValue else right[-1]
            at = right[-1].y if boolValue else left[-1].y
            lerped = lerpAtY(fromV, toV, at)
            self.Draw_Flat_Quad(self.texture, (lerped if boolValue else left[-1]), currLeft, (right[-1] if boolValue else lerped), currRight, loop)
            currLeft = lerped if boolValue else left.pop()
            currRight = right.pop() if boolValue else lerped

    def Draw_Flat_Quad(self, texture:Texture, bl:Vertex, tl:Vertex, br:Vertex, tr:Vertex, loop:int):
        invDenom = 0
        if (tl.y == bl.y):
            invDenom = 0
        else:
            invDenom = FixedPointNumber(1 / (tl.y - bl.y), 16, 15)

        bly = math.floor(bl.y)
        tly = math.floor(tl.y)

        def invMult(t:float, b:float, d:float):
            return FixedPointNumber(FixedPointNumber(abs(t - b), 16, d, True) * invDenom, 16, d) * (-1 if t < b else 1)

        dsx = invMult(tl.x, bl.x, 7);
        dex = invMult(tr.x, br.x, 7);
        dsz = invMult(tl.z, bl.z, 15);
        dez = invMult(tr.z, br.z, 15);
        dsu = invMult(tl.u, bl.u, 15);
        deu = invMult(tr.u, br.u, 15);
        dsv = invMult(tl.v, bl.v, 15);
        dev = invMult(tr.v, br.v, 15);

        sx = FixedPointNumber(bl.x, 16, 7, True)
        sz = FixedPointNumber(bl.z, 16, 15, True)
        su = FixedPointNumber(bl.u, 16, 15, True)
        sv = FixedPointNumber(bl.v, 16, 15, True)
        ex = FixedPointNumber(br.x, 16, 7, True)
        ez = FixedPointNumber(br.z, 16, 15, True)
        eu = FixedPointNumber(br.u, 16, 15, True)
        ev = FixedPointNumber(br.v, 16, 15, True)

        for y in range(bly, tly + 1):
            if (loop < 2 and y == tly and (tly - bly) > 0):
                break 
            if (0 <= y and y < SCREEN_HEIGHT):
                self.Draw_Scanline(
                    y, 
                    sx, ex,
                    sz, ez,
                    su, eu, 
                    sv, ev,
                    texture,
                )
            sx = FixedPointNumber(sx + dsx, 16, 7, True)
            sz = FixedPointNumber(sz + dsz, 16, 15, True)
            su = FixedPointNumber(su + dsu, 16, 15, True)
            sv = FixedPointNumber(sv + dsv, 16, 15, True)
            ex = FixedPointNumber(ex + dex, 16, 7, True)
            ez = FixedPointNumber(ez + dez, 16, 15, True)
            eu = FixedPointNumber(eu + deu, 16, 15, True)
            ev = FixedPointNumber(ev + dev, 16, 15, True)
    
    def Draw_Scanline(
        self,
        y:int,
        sx:float, ex:float,
        sz:float, ez:float,
        su:float, eu:float,
        sv:float, ev:float,
        texture:any
    ):
        if (ex < 0 or sx >= SCREEN_WIDTH):
            return
        if (sx > ex):
            ex = sx
        fx = FixedPointNumber(min(0, sx) + (abs(FixedPointNumber(math.floor(sx) - sx, 16, 7, True)) if sx >= 0 else 0), 16, 7, True) * -1

        dz = 0
        du = 0
        dv = 0
        inv = 0
        if (math.floor(ex) == math.floor(sx)):
            dz = 0
            du = 0
            dv = 0
            inv = 0
        else:
            if (ex - sx >= 1):
                inv = FixedPointNumber(1 / (ex - sx), 17, 16)
            else:
                inv = 0
            ddu = abs(FixedPointNumber((eu - su), 16, 15, True))
            ddus = (FixedPointNumber((eu - su), 16, 15, True) < 0)
            du = FixedPointNumber(
                ddu * inv, 24, 23, True
            ) * (-1 if ddus else 1)
            ddu = abs(FixedPointNumber((ez - sz), 16, 15, True))
            ddus = (FixedPointNumber((ez - sz), 16, 15, True) < 0)
            dz = FixedPointNumber(
                ddu * inv, 24, 23, True
            ) * (-1 if ddus else 1)
            ddu = abs(FixedPointNumber((ev - sv), 16, 15, True))
            ddus = (FixedPointNumber((ev - sv), 16, 15, True) < 0)
            dv = FixedPointNumber(
                ddu * inv, 24, 23, True
            ) * (-1 if ddus else 1)
        u = FixedPointNumber(su + FixedPointNumber(fx * du, 16, 15, True), 16, 15, True)
        v = FixedPointNumber(sv + FixedPointNumber(fx * dv, 16, 15, True), 16, 15, True)
        z = FixedPointNumber(sz + FixedPointNumber(fx * dz, 16, 15, True), 16, 15, True)
        sx = math.floor(sx)
        ex = math.floor(ex)

        offset = 1

        def do_16_bit_div(a:float, b:float):
            result = 0
            a = 2 * a
            if (a - b >= 0):
                a -= b
                result += 0.5
            b = FixedPointNumber(b / 2, 16, 15)
            if (a - b >= 0):
                a -= b
                result += 0.25
            b = FixedPointNumber(b / 2, 16, 15)
            if (a - b >= 0):
                a -= b
                result += 0.125
            b = FixedPointNumber(b / 2, 16, 15)
            return result

        for x in range(max(0, math.floor(sx)), math.floor(ex) + 1):
            offset += 1
            if (0 <= x and x < SCREEN_WIDTH):
                t = self.zbuffer[y][x]
                if (t[0] <= min(127, math.floor(512 * z))):
                    divu = do_16_bit_div(
                        FixedPointNumber(u + (FixedPointNumber(du, 16, 15, True) - du) * (offset % 2), 16, 15, True),
                        FixedPointNumber(z + (FixedPointNumber(dz, 16, 15, True) - dz) * (offset % 2), 16, 15, True)
                    )
                    divv = do_16_bit_div(
                        FixedPointNumber(v + (FixedPointNumber(dv, 16, 15, True) - dv) * (offset % 2), 16, 15, True),
                        FixedPointNumber(z + (FixedPointNumber(dz, 16, 15, True) - dz) * (offset % 2), 16, 15, True)
                    )
                    a = max(0, min(7, math.floor(8 * divu)))
                    b = max(0, min(7, math.floor(8 * divv)))
                    sampledTexture = Textures[texture]
                    color = sampledTexture[8 * (7 - b) + a]
                    if (self.settings.transparent and color == 0):
                        z += dz
                        u += du
                        v += dv
                        continue
                    if (self.settings.inverted):
                        color = color ^ 1
                    if (self.settings.overlay):
                        color = color ^ t[1]
                    self.zbuffer[y][x] = [
                        math.floor(min(127, 512 * z)),
                        color
                    ]
            z += dz
            u += du
            v += dv

    def IsBackfacing(v1:Vertex, v2:Vertex, v3:Vertex) -> bool:
        crossProduct = (
            FixedPointNumber((v3.x - v1.x) * (v1.y - v2.y), 17, 0, True)
            - FixedPointNumber((v1.y - v3.y) * (v2.x - v1.x), 17, 0, True)
        )
        return (crossProduct < 0)
    
    def Cam_To_Screen(vertex:Vertex) -> Vertex:
        vx = vertex.x
        vy = vertex.y
        vz = vertex.z
        invZ = FixedPointNumber(1 / vz, 17, 16)
        persp = FixedPointNumber(LENS * invZ, 16, 10)
        vx = FixedPointNumber(abs(vx) * persp, 16, 0) * (1 if vx >= 0 else -1)
        vy = FixedPointNumber(abs(vy) * persp, 16, 0) * (1 if vy >= 0 else -1)
        nvx = FixedPointNumber(vx + math.floor(SCREEN_WIDTH / 2), 16, 0, True)
        nvy = FixedPointNumber(SCREEN_HEIGHT - 1 - math.floor(SCREEN_HEIGHT / 2) - vy, 16, 0, True)

        if (nvy > 255):
            nvy = 255

        if (nvy < -255):
            nvy = -255

        if (nvx > 255):
            nvx = 255

        if (nvx < -255):
            nvx = -255

        vu = FixedPointNumber(vertex.u * invZ, 16, 15)
        vv = FixedPointNumber(vertex.v * invZ, 16, 15)
        return Vertex(nvx, nvy, invZ, vu, vv)
    
    def CamRotToMatrix(self, pitchIndex:int, yawIndex:int) -> list[list[float]]:
        self.cam["rotation"][0] = yawIndex
        self.cam["rotation"][1] = pitchIndex
        c = math.pi * 2 * (yawIndex / 16)
        b = math.pi * 2 * (pitchIndex / 16)

        def sin(ang:float):
            return FixedPointNumber(abs(math.sin(ang)), 16, 14) * (1 if math.sin(ang) > 0 else -1)

        def cos(ang:float):
            return FixedPointNumber(abs(math.cos(ang)), 16, 14) * (1 if math.cos(ang) > 0 else -1)

        return [
            [cos(c),            0,      sin(c)          ],
            [sin(b) * sin(c),   cos(b), -sin(b) * cos(c)],
            [-cos(b) * sin(c),  sin(b), cos(b) * cos(c) ]
        ]

    def world_to_cam(self, vertex:Vertex):
        ovx = vertex.x - self.cam.x
        ovy = vertex.y - self.cam.y
        ovz = vertex.z - self.cam.z
        vx = FixedPointNumber(self.cam["matrix"][0][0] * ovx + self.cam["matrix"][0][1] * ovy + self.cam["matrix"][0][2] * ovz, 16, 7, True )
        vy = FixedPointNumber(self.cam["matrix"][1][0] * ovx + self.cam["matrix"][1][1] * ovy + self.cam["matrix"][1][2] * ovz, 16, 7, True )
        vz = FixedPointNumber(self.cam["matrix"][2][0] * ovx + self.cam["matrix"][2][1] * ovy + self.cam["matrix"][2][2] * ovz, 16, 7, True )
        return Vertex(vx, vy, vz, vertex.u, vertex.v)