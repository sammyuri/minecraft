from .instruction import Opcodes, CPUError


def do_alu(
    a: int, b: int, opcode: int, type: int, carry: bool = False
) -> tuple[int, tuple[bool, bool, bool, bool]]:

    """
    Perform an ALU operation

    Performs the operation defined by 'opcode' and 'type' to inputs a and b.
    For addition/subtraction with carry, the carry flag is also input.
    The output is a tuple of the result, and another tuple containing the flags
    (carry, zero, even, signed overflow ^ negative).
    """

    carry = False
    output = 0

    if opcode == Opcodes.AIM:  # AND immediate
        output = a & b

    elif opcode == Opcodes.CMP:  # Compare
        output = (a + (255 ^ b) + 1) % 256
        if a + (255 ^ b) + 1 > 255:
            carry = True

    elif opcode == Opcodes.CMA:  # Compare with AND
        output = a & b

    elif opcode == Opcodes.ADD:
        if type == 0:  # Normal addition
            output = (a + b) % 256
            if a + b > 255:
                carry = True
        if type == 1:  # Add with carry
            output = (a + b + int(carry)) % 256
            if a + b + int(carry) > 255:
                carry = True
        if type == 2:  # Add with vector byte mode
            output = (
                (a % 16 + b % 16) % 16
                + (a // 16 + b // 16) % 16 * 16
            )
            if a // 16 + b // 16 > 16:
                carry = True
        if type == 3:  # Unused
            raise CPUError("Invalid ALU operation") from None

    elif opcode == Opcodes.SUB:
        if type == 0:  # Normal subtraction
            output = (a + (255 ^ b) + 1) % 256
            if a + (255 ^ b) + 1 > 255:
                carry = True
        if type == 1:  # Add with carry
            output = (a + (255 ^ b) + int(carry)) % 256
            if a + (255 ^ b) + int(carry) > 255:
                carry = True
        if type == 2:  # Unused
            raise CPUError("Invalid ALU operation") from None
        if type == 3:  # Unused
            raise CPUError("Invalid ALU operation") from None

    elif opcode == Opcodes.ADI:  # Add immediate
        output = (a + ((b + 256) % 256)) % 256
        if a + ((b + 256) % 256) > 255:
            carry = True

    elif opcode == Opcodes.BIT:
        if type == 0:  # IMPLIES
            output = (~a) | b
        if type == 1:  # XOR
            output = a ^ b
        if type == 2:  # AND
            output = a & b
        if type == 3:  # OR
            output = a | b

    elif opcode == Opcodes.BNT:
        if type == 0:  # NIMPLIES
            output = ~((~a) | b)
        if type == 1:  # XNOR
            output = ~(a ^ b)
        if type == 2:  # NAND
            output = ~(a & b)
        if type == 3:  # NOR
            output = ~(a | b)

    elif opcode in (Opcodes.SHF, Opcodes.SFI):
        if type == 0:  # Shift left
            output = (a << (b % 8)) % 256
        if type == 1:  # Shift right
            output = (a >> (b % 8))
        if type == 2:  # Rotate right
            output = (a >> (b % 8)) + (a << (8 - b % 8)) % 256
        if type == 3:  # Arithmetic shift right
            output = (a >> b % 8)
            if a > 127:
                output |= 255 ^ (255 >> b % 8)

    elif opcode == Opcodes.MUL:
        if type == 0:  # Multiply (lower byte)
            output = (a * b) % 256
        if type == 1:  # Multiply (higher byte)
            output = (a * b) // 256
        if type == 2:  # Divide
            output = a // b
        if type == 3:  # Mod
            output = a % b

    elif opcode == Opcodes.UDA:
        raise CPUError("Invalid ALU operation") from None

    elif opcode == Opcodes.UDB:
        raise CPUError("Invalid ALU operation") from None

    elif opcode == Opcodes.BCT:
        if type == 0:  # Square root
            output = int(a ** 0.5)
        if type == 1:  # Leading zero count
            output = 8 - len(str(bin(a))[2:])
        if type == 2:  # Trailing zero count
            output = 8 - len(str(bin(int(str(bin(a))[2:].zfill(8)[::-1])))[2:])
        if type == 3:  # Count ones
            output = str(bin(a))[2:].count("1")

    # Compute remaining flags
    zero = (output == 0)
    even = (output % 2 == 0)
    overflow = (a ^ 128 >= b ^ 128)

    return output, (carry, zero, even, overflow)
