from .peripherals.base import Peripheral
from .peripherals.minecraftdisplay import MinecraftDisplay
from .peripherals.trianglerom import TriangleROM, DirectionROM

from .emulator import CPUError

from enum import Enum


class Ports:
    """IO ports for the CHUNGUS2"""
    def __init__(self) -> None:
        self.ports = [Peripheral(i) for i in range(256)]

        self.mcdisplay = MinecraftDisplay(64, 32)
        for port in range(64, 95):
            self.ports[port] = self.mcdisplay
        self.trianglerom = TriangleROM(128, 36)
        for port in range(128, 128+36):
            self.ports[port] = self.trianglerom
        self.directionrom = DirectionROM(32, 16)
        for port in range(32, 32+16):
            self.ports[port] = self.directionrom

    def add_peripheral(self, peri: Peripheral) -> None:
        """Add a peripheral"""
        for port in range(peri.port, peri.port + peri.portrange):
            self.ports[port] = peri

    def port_load(self, port: int) -> int:
        """Load from a peripheral"""
        return self.ports[port].send(port)

    def port_store(self, port: int, value: int) -> None:
        """Output to a peripheral"""
        self.ports[port].receive(value, port)


class IO_Port(Enum):
    CRAFTROM = 0

    RNG = 1

    PI1 = 2
    PI2 = 3

    BLOCKRAM_XY = 4
    BLOCKRAM_Z = 5
    BLOCKRAM_ID = 6
    BLOCKRAM_ZI = 7

    MESHGEN_BLOCKXY = 8
    MESHGEN_BLOCKZ = 9
    MESHGEN_BREAKPHASE = 10
    MESHGEN_ITEMXZ = 11
    MESHGEN_ITEMY = 12; MESHGEN_RENDERFACE = 12
    MESHGEN_ITEMID = 13; MESHGEN_RENDERITEM = 13
    MESHGEN_TEX = 14; MESHGEN_RENDEROVERLAY = 14
    MESHGEN_SETTINGS = 15; MESHGEN_RENDERSCENE = 15

    AMOGUS_CAMX = 16
    AMOGUS_CAMY = 17
    AMOGUS_CAMZ = 18
    AMOGUS_CAMROT = 19
    AMOGUS_VERTX = 20
    AMOGUS_VERTY = 21
    AMOGUS_VERTZ = 22
    AMOGUS_VERTUV = 23; AMOGUS_SINYAW = 23
    AMOGUS_TEX = 24; AMOGUS_COSYAW = 24
    AMOGUS_SETTINGS = 25; AMOGUS_DRAWTOSCREEN = 25
    AMOGUS_CAMDIRX = 26
    AMOGUS_CAMDIRY = 27
    AMOGUS_CAMDIRZ = 28
    AMOGUS_SUBMITVERT = 29
    AMOGUS_DRAWQUAD = 30
    AMOGUS_CLEARBUFFER = 31