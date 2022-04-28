from .base import Peripheral


class DirectionROM(Peripheral):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.values = [
            (2, 0),
            (2, 1),
            (2, 2),
            (1, 2),
            (0, 2),
            (-1, 2),
            (-2, 2),
            (-2, 1),
            (-2, 0),
            (-2, -1),
            (-2, -2),
            (-1, -2),
            (0, -2),
            (1, -2),
            (2, -2),
            (2, -1),
        ]

    def send(self, port: int) -> int:
        dir = (port) % 16
        return (self.values[dir][0] & 15) << 4 | (self.values[dir][1] & 15)


class TriangleROM(Peripheral):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.values = [
            0b00100, 0b11010, 0b10110,
            0b00100, 0b01000, 0b11010,

            0b00001, 0b11111, 0b10011,
            0b00001, 0b01101, 0b11111,

            0b00000, 0b11011, 0b10010,
            0b00000, 0b01001, 0b11011,

            0b00101, 0b11110, 0b10111,
            0b00101, 0b01100, 0b11110,

            0b00000, 0b11101, 0b01001,
            0b00000, 0b10100, 0b11101,

            0b00110, 0b11011, 0b01111,
            0b00110, 0b10010, 0b11011,
        ]

    def send(self, port: int) -> int:
        return self.values[port - 128]