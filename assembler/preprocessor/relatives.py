from ..formats import Instruction


def parse_relatives(lines: list[Instruction]) -> list[Instruction]:
    """find all of the relative addresses and replace them with immidiates"""

    # Convert relatives to immidiates
    resultLines = []
    for index in range(len(lines)):
        instr = lines[index]
        mnemonic, operands = instr.get_mnemonic_and_operands()
        newOperands = []
        for operand in operands:
            if is_relative(operand):
                newOperands.append(relative_to_immidiate(operand, index))
            else:
                newOperands.append(operand)
        resultLines.append(Instruction(
            (mnemonic + " " + ", ".join(newOperands)).strip(),
            index,
        ))
    return resultLines


def is_relative(operand) -> bool:
    return operand[:1] == "~"

def relative_to_immidiate(operand, lineNumber) -> str:
    return str(lineNumber + int(operand[1:]))