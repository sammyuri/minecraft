from collections import namedtuple


class Instruction(namedtuple("Instruction", "text linenum")):
    """Generic assembly instruction"""
    def __init__(self, *args):
        super().__init__()

    def get_mnemonic(self) -> str:
        return self.text.split()[0]

    def get_operands(self) -> list[str]:
        return list(map(
            lambda arg: arg.strip(),
            self.text[len(self.get_mnemonic()) + 1:].split(",")
        ))

    def get_mnemonic_and_operands(self) -> tuple[str, list[str]]:
        return self.get_mnemonic(), self.get_operands()

    def is_label(self) -> bool:
        return self.text[0] == "."

    def is_macro(self) -> bool:
        return self.text[0] != "@" and "(" in self.text

    def get_macro_name(self) -> str:
        return self.text.split("(")[0]


class AssemblerError(Exception):
    pass


##############################################################################
# Bit layout of all instructions in machine code
##############################################################################

# A bit pattern -> That exact bit pattern
# BITS          -> A bit pattern that changes based on the opcode
# OPERAND       -> A bit pattern that changes based on that operand
# REG           -> A general purpose register, 000 to 111
# IMM_x         -> An immediate of length x bits

LAYOUTS = {
    "NOP": ("00000", "00000000000"),
    "HLT": ("00001", "00000000000"),
    "STS": ("00010", "BITS", "IMM_8"),
    "CLI": ("00011", "REG", "OPERAND", "IMM_5"),
    "JMP": ("00100", "IMM_11"),
    "CAL": ("00101", "IMM_11"),
    "RET": ("00110", "00000000000"),
    "BRH": ("00111", "OPERAND", "BITS", "IMM_6"),
    "SST": ("01000", "00", "BITS", "00000", "REG"),
    "SLD": ("01001", "REG", "00000", "OPERAND"),
    "PST": ("01010", "REG", "IMM_8"),
    "PLD": ("01011", "REG", "IMM_8"),
    "PSH": ("01100", "REG", "BITS", "IMM_6"),
    "POP": ("01101", "REG", "BITS", "IMM_6"),
    "MST": ("01110", "REG", "IMM_8"),
    "MLD": ("01111", "REG", "IMM_8"),
    "LIM": ("10000", "REG", "IMM_8"),
    "AIM": ("10001", "REG", "IMM_8"),
    "CMP": ("10010", "REG", "IMM_8"),
    "CMA": ("10011", "REG", "IMM_8"),
    "MOV": ("10100", "REG", "REG", "00000"),
    "ADD": ("10101", "REG", "REG", "BITS", "REG"),
    "SUB": ("10110", "REG", "REG", "BITS", "REG"),
    "ADI": ("10111", "REG", "REG", "IMM_5"),
    "BIT": ("11000", "REG", "REG", "BITS", "REG"),
    "BNT": ("11001", "REG", "REG", "BITS", "REG"),
    "SHF": ("11010", "REG", "REG", "BITS", "REG"),
    "SFI": ("11011", "REG", "REG", "BITS", "IMM_3"),
    "MUL": ("11100", "REG", "REG", "BITS", "REG"),
    "UDA": ("11101", "REG", "REG", "IMM_2", "REG"),
    "UDB": ("11110", "REG", "REG", "IMM_2", "REG"),
    "BCT": ("11111", "REG", "REG", "BITS", "REG"),
}

OPERANDS = {
    # Branch conditions and aliases
    "TRUE": "000",     "ALWAYS": "000",
    "EVEN": "001",
    "HIGHER": "010",   "GRTR": "010",     "GREATER": "010",
    "LESS": "011",     "LOWER": "011",    "NCARRY": "011",
    "ZERO": "100",     "EQUAL": "100",
    "NZERO": "101",    "NEQUAL": "101",
    "GRTREQ": "110",   "HIGHEQ": "110",   "CARRY": "110",
    "LESSEQ": "111",   "LOWEQ": "111",    "LOWEREQ": "111",
    # Special registers
    "SP": "000",
    "FLAGS": "001",
}

# If not in ALIAS, assume same opcode
ALIAS = {
    "ABC": "STS",      "FNU": "STS",      "LOOPCNT": "STS",  "LOOPSRC": "STS",
    "SSP": "STS",
    "BRN": "BRH",      "BRT": "BRH",
    "POI": "SST",      "EPOI": "SST",
    "PSHU": "PSH",     "DSP": "PSH",
    "POPU": "POP",     "ISP": "POP",
    "ADDC": "ADD",     "ADDV": "ADD",     "ADDVC": "ADD",
    "SUBC": "SUB",     "SUBC": "SUB",     "SUBVC": "SUB",
    "IMP": "BIT",      "XOR": "BIT",      "AND": "BIT",      "OR": "BIT",
    "NIMP": "BNT",     "XNOR": "BNT",     "NAND": "BNT",     "NOR": "BNT",
    "BSL": "SHF",      "BSR": "SHF",      "ROT": "SHF",      "SXTSR": "SHF",
    "BSLI": "SFI",     "BSRI": "SFI",     "ROTI": "SFI",     "SXTSRI": "SFI",
    "MULU": "MUL",     "DIV": "MUL",      "MOD": "MUL",
    "SQRT": "BCT",     "LZR": "BCT",      "TZR": "BCT",
}

BITS = {
    # Settings
    "ABC": "000",      "FNU": "001",      "LOOPCNT": "010",  "LOOPSRC": "011",
    "SSP": "100",
    "POI": "0",        "EPOI": "1",
    # Branch aliases
    "BRH": "00",       "BRN": "00",       "BRT": "10",
    # Stack
    "PSH": "00",       "PSHU": "10",      "DSP": "01",
    "POP": "00",       "POPU": "10",      "ISP": "01",
    # ALU operations
    "ADD": "00",       "ADDC": "01",      "ADDV": "10",      "ADDVC": "11",
    "SUB": "00",       "SUBC": "01",      "SUBV": "10",      "SUBVC": "11",
    "IMP": "00",       "XOR": "01",       "AND": "10",       "OR": "11",
    "NIMP": "00",      "XNOR": "01",      "NAND": "10",      "NOR": "11",
    "BSL": "00",       "BSR": "01",       "ROT": "10",       "SXTSR": "11",
    "BSLI": "00",      "BSRI": "01",      "ROTI": "10",      "SXTSRI": "11",
    "MUL": "00",       "MULU": "01",      "DIV": "10",       "MOD": "11",
    "SQRT": "00",      "BCT": "11",       "LZR": "01",       "TZR": "10",
}
