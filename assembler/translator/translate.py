from .parseline import parse_line

from ..formats import Instruction, AssemblerError


def translate(lines: list[Instruction]) -> list[str]:
    """Translate a list of assembly instructions to machine code"""

    result = []
    for instr in lines:
        try:
            machinecode = parse_line(instr)
        except AssemblerError as error:
            # Add line number (from original source code) to error
            raise AssemblerError(
                f"Error on line {instr.linenum} ({instr.text}): {error}"
            ) from None
        else:
            result.append(machinecode)

    return result
