from enum import Enum, auto


class CPUError(Exception):
    pass


class Opcodes(Enum):
    NOP = 0
    HLT = 1
    STS = 2
    CLI = 3
    JMP = 4
    CAL = 5
    RET = 6
    BRH = 7

    POI = 8
    SLD = 9
    PST = 10
    PLD = 11
    PSH = 12
    POP = 13
    MST = 14
    MLD = 15

    LIM = 16
    AIM = 17
    CMP = 18
    CMA = 19
    MOV = 20
    ADD = 21
    SUB = 22
    ADI = 23
    BIT = 24
    BNT = 25
    SHF = 26
    SFI = 27
    MUL = 28
    UDA = 29
    UDB = 30
    BCT = 31


class MCInstruction:
    """A machine code instruction"""
    def __init__(self, binary: str) -> None:
        # Get opcode and operands
        self.opcode = Opcodes(int(binary[0:5], 2))
        self.a = int(binary[5:8], 2)
        self.b = int(binary[9:12], 2)
        self.type = int(binary[12:14], 2)
        self.c = int(binary[14:17], 2)

        # Get immediate (if needed)
        self.immediate = 0

        if self.opcode in (  # 11-bit immediate
            Opcodes.JMP, Opcodes.CAL
        ):
            self.immediate = 256 * self.a + int(binary[9:17], 2)

        if self.opcode in (  # 8-bit immediate
            Opcodes.STS, Opcodes.PST, Opcodes.PLD, Opcodes.MST, Opcodes.MLD,
            Opcodes.LIM, Opcodes.AIM, Opcodes.CMP, Opcodes.CMA
        ):
            self.immediate = int(binary[9:17], 2)

        if self.opcode in (  # 6-bit immediate
            Opcodes.BRH, Opcodes.PSH, Opcodes.POP
        ):
            self.immediate = int(binary[11:17], 2)

        if self.opcode in (  # 5-bit signed immediate
            Opcodes.CLI, Opcodes.ADI
        ):
            self.immediate = (int(binary[12:17], 2) ^ 16) - 16

        if self.opcode in (  # 3-bit immediate
            Opcodes.SFI, Opcodes.BCT
        ):
            self.immediate = self.c

        # Get other control bits (if needed)
        if self.opcode == Opcodes.BRH:
            self.type = int(binary[9], 2)
        if self.opcode == Opcodes.POI:
            self.type = int(binary[7], 2)
        if self.opcode in (Opcodes.PSH, Opcodes.POP):
            self.type = int(binary[9:11], 2)
