from ..formats import *


def format_line(line: str) -> str:
    """Split 16-bit machine code instructions into 2 bytes"""

    return line[0:8] + " " + line[8:16]


def to_decimal(number: str) -> int:
    """Convert other bases to decimal"""

    if number[0:2] == "0b":  # Binary
        return int(number[2:], 2)
    if number[0:2] == "0x":  # Hex
        return int(number[2:], 16)
    if number[0:2] == "0o":  # Octal
        return int(number[2:], 8)
    # Default - decimal
    return int(number)


def get_binary(number: int, length: int) -> str:
    """Convert a decimal number to a (signed) binary number of given length"""

    # Take result mod 2^length
    if number < 0:
        number = 2 ** length + number
    result = str(bin(number % (2 ** length)))[2:]
    return result.zfill(length)


def parse_immediate(immediate: str, length: int) -> str:
    """Get the binary representation of an immediate value"""

    # Make sure immediate exists
    if not immediate:
        raise AssemblerError(
            f"Invalid immediate: {immediate}"
        ) from None

    # ASCII character
    if immediate[0] == '"':
        return get_binary(ord(immediate[1].replace("@", " ")), length)

    # Remove prefix e.g. "M10" (for memory address 10) -> "10"
    if not immediate[0] in "-0123456789":
        prefix = immediate[0]
        immediate = immediate[1:]
    else:
        prefix = ""

    # Make sure immediate is an integer
    try:
        immediateindex = to_decimal(immediate)
    except ValueError:
        raise AssemblerError(
            f"Immediate is not an integer: {prefix + immediate}"
        ) from None
    else:
        return get_binary(immediateindex, length)


def parse_register(register: str) -> str:
    """Get the binary representation of a register"""

    # Verify it is actually a register
    if not (len(register) == 2 and register[0] in ("$", "r", "R")):
        raise AssemblerError(
            f"Invalid register (incorrect format): {register}"
        ) from None

    # Make sure register is valid
    try:
        registerindex = to_decimal(register[1:])
    except ValueError:
        raise AssemblerError(
            f"Invalid register (not a decimal number): {register}"
        ) from None
    if registerindex > 7:
        raise AssemblerError(
            f"Invalid register (index too large): {register}"
        ) from None

    return get_binary(registerindex, 3)


def parse_line(line: Instruction) -> str:
    """Translate an assembly instruction to machine code"""

    mnemonic, operands = line.get_mnemonic_and_operands()
    # Get base instruction
    base = ALIAS.get(mnemonic.upper(), mnemonic.upper())
    if base not in LAYOUTS:
        raise AssemblerError(
            f"Invalid mnemonic: {mnemonic}"
        ) from None

    # Translate operands
    result = ""
    for index, operand in enumerate(LAYOUTS[base]):

        # Register (default R0)
        if operand == "REG":
            result += parse_register(operands.pop(0)) if operands else "000"

        # Fixed length immediate (default 0)
        elif operand[0:3] == "IMM":
            length = int(operand.split("_")[1])
            if not operands:
                result += "0" * length
            else:
                result += parse_immediate(operands.pop(0), length)

        # Bit pattern dependent on the mnemonic
        elif operand == "BITS":
            result += BITS[mnemonic.upper()]

        # Bit pattern dependent on the operand
        elif operand == "OPERAND":
            if not operands:
                raise AssemblerError(
                    f"Not enough operands (expected {len(LAYOUTS[base])}, \
                      found {index}) for instruction: '{line.text}'"
                ) from None
            if not operands[0].upper() in OPERANDS:
                raise AssemblerError(
                    f"Unknown operand '{operands[0]}' for instruction: \
                      {mnemonic}"
                )
            result += OPERANDS[operands.pop(0).upper()]

        # Fixed bit pattern
        else:
            result += operand

    return format_line(result)
