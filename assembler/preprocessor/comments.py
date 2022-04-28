from ..formats import Instruction


def remove_comments(lines: list[Instruction]) -> list[Instruction]:
    """Remove comments and empty lines"""

    result = []
    for instr in lines:
        # Remove comments
        if "//" in instr.text:
            instr = Instruction(
                instr.text[:instr.text.index("//")].strip(),
                instr.linenum,
            )
        if ";" in instr.text:
            instr = Instruction(
                instr.text[:instr.text.index(";")].strip(),
                instr.linenum,
            )
        # Ignore blank lines
        if instr.text.strip():
            result.append(Instruction(
                instr.text.strip(),
                instr.linenum,
            ))
    return result
