from ..formats import Instruction


def parse_labels(lines: list[Instruction]) -> list[Instruction]:
    """Parse labels into jump addresses"""

    labels = {}
    index = 0
    # Find all labels and their line numbers
    while index < len(lines):
        if lines[index].is_label():
            # Add to label dict and remove from lines
            labels[lines[index].text] = str(index)
            lines.pop(index)
        else:
            index += 1

    # Convert labels to immediates
    resultlines = []
    for instr in lines:
        mnemonic, operands = instr.get_mnemonic_and_operands()
        # Parse labels
        operands = [labels.get(operand, operand) for operand in operands]
        # Turn back into assembly instruction
        resultlines.append(Instruction(
            (mnemonic + " " + ", ".join(operands)).strip(),
            instr.linenum,
        ))

    return resultlines
