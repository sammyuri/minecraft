class Peripheral:
    """A basic peripheral"""
    def __init__(self, port: int, portrange: int = 1) -> None:
        self.port = port
        self.portrange = portrange

    def receive(self, data: int, port: int) -> None:
        """Receive a byte from the CPU"""
        print(f"{port}: {data}")

    def send(self, port: int) -> int:
        """Send a byte to the CPU"""
        return 0
