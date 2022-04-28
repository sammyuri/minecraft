from .peripherals.base import Peripheral
from .peripherals.minecraftdisplay import MinecraftDisplay
from .peripherals.trianglerom import TriangleROM, DirectionROM

from .emulator import CPUError


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
