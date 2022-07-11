from ..formats import Instruction, AssemblerError


def parse_labelled_pages(lines: list[Instruction]) -> list[Instruction]:
    """Add NOPs between labelled pages to fix size at 64 instructions"""

    # (To prevent 64 NOPs at the start of program)
    if lines[0].text[0:5] == ".PAGE":
        lines.pop(0)

    instructioncount = 0
    pagecount = 0
    resultlines = []
    for instr in lines:
        # If a new page is found and the last one is not full, fill with NOPs
        # (which assemble to 00000000 00000000)
        if instr.text[0:5] == ".PAGE":
            # Raise an error if page size is larger than 64
            if instructioncount > 64:
                raise AssemblerError(
                    f"Page {pagecount} too large, contains {instructioncount} \
                      instructions (max 64 allowed)"
                ) from None

            resultlines.extend([
                Instruction("NOP", instructioncount)  # Placeholder line number
                for i in range(64 - instructioncount)
            ])
            instructioncount = 0
            pagecount += 1

        elif instr.text[0:5] == ".BANK":
            if instructioncount > 64:
                raise AssemblerError(
                    f"Page {pagecount} too large, contains {instructioncount} \
                      instructions (max 64 allowed)"
                ) from None

            resultlines.extend([
                Instruction("NOP", instructioncount)  # Placeholder line number
                for i in range(64 - instructioncount)
            ])
            instructioncount = 0
            pagecount += 1
            while pagecount < 32:
                pagecount += 1
                resultlines.extend([
                    Instruction("NOP", instructioncount)  # Placeholder line number
                    for i in range(64)
                ])

        # Otherwise, add to resultlines
        else:
            resultlines.append(instr)
            # Ignore labels in instruction count
            if not instr.is_label():
                instructioncount += 1

    # Raise an error if last page size is larger than 64
    if instructioncount > 64:
        raise AssemblerError(
            f"Page {pagecount} too large, contains {instructioncount} \
              instructions (max 64 allowed)"
        ) from None

    return resultlines


def parse_pages(lines: list[Instruction]) -> list[Instruction]:
    """Split a list of instructions into pages of size 64 instructions each"""

    # TODO: add algorithm to automatically generate pages from long code
    return parse_labelled_pages(lines)
