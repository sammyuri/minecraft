from collections import namedtuple
from concurrent.futures import process

from ..formats import Instruction, AssemblerError


def find_macros(lines: list[Instruction]) -> tuple[
    list[Instruction],
    dict[str, str],
    dict[str, tuple[list[str], list[Instruction]]],
]:
    """
    Find and remove macros from a list of instructions

    Returns a list of instructions with all macros removed, a dict of macros
    that replace one string with another, and a dict of macros that substitute
    one or more instructions. The latter is in the form of two lists: the first
    contains the parameters and the second the instructions to replace with.
    """
    resultlines = []
    stringmacros = {}
    functionmacros = {}

    def macro_definition_error(index):
        raise AssemblerError(
            f"Macro on line {lines[index].linenum} improperly defined: \
              {lines[index].text}"
        ) from None

    index = 0
    while index < len(lines):
        # Regular instruction
        if lines[index].text[0:7].upper() != "@DEFINE":
            resultlines.append(lines[index])
            index += 1
            continue

        macro = lines[index].text[8:]
        # Function macro
        if "(" in macro:
            # multiple instructions
            if macro[-1] == "{":
                macro = macro[:-3].split("(")
                if len(macro) != 2:
                    macro_definition_error(index)
                # Get list of instructions to replace with
                macroinstructions = []
                origindex = index
                index += 1
                while lines[index].text != "}":
                    macroinstructions.append(lines[index])
                    index += 1
                    if index >= len(lines):
                        macro_definition_error(origindex)
                functionmacros[macro[0]] = (
                    list(map(lambda arg: arg.strip(), macro[1].split(","))),
                    macroinstructions.copy()
                )

            # One-liner
            else:
                macro = macro.split(") ")
                if len(macro) != 2:
                    macro_definition_error(index)
                # Get name and operands
                name = macro[0].split("(")
                if len(name) != 2:
                    macro_definition_error(index)
                functionmacros[name[0]] = (
                    list(map(lambda arg: arg.strip(), name[1].split(","))),
                    [Instruction(macro[1], 0)]
                )
            index += 1

        # Token macro
        else:
            macro = macro.split()
            if len(macro) != 2:
                macro_definition_error(index)
            stringmacros[macro[0]] = macro[1]
            index += 1

    return resultlines, stringmacros, functionmacros


def replace_string_macros(
    lines: list[Instruction], macros: dict[str, str]
) -> list[Instruction]:
    """Apply string macros to a list of instructions"""

    resultlines = []
    for instr in lines:
        # Label - ignore
        if instr.is_label():
            resultlines.append(instr)
            continue

        mnemonic, operands = instr.get_mnemonic_and_operands()
        # Apply macros
        for index, operand in enumerate(operands):
            if operand in macros:
                operands[index] = macros[operand]
        resultlines.append(Instruction(
            (mnemonic + " " + ", ".join(operands)).strip(),
            instr.linenum,
        ))

    return resultlines


def process_function_macro(
    instr: Instruction,
    macro: tuple[list[str], list[Instruction]]
) -> list[Instruction]:
    """Parse a function macro"""

    # Get arguments
    arguments = list(map(
        lambda arg: arg.strip(),
        instr.text.split("(")[1].strip()[:-1].split(",")
    ))
    if len(arguments) != len(macro[0]):
        raise AssemblerError(
            f"Improper use of macro {instr.text.split('(')[0]} on \
              line {instr.linenum}: {instr.text}"
        ) from None
    argmap = {macro[0][i]: arguments[i] for i in range(len(arguments))}

    # Add instructions, replacing operands where necessary
    resultlines = []
    for macroinstr in macro[1]:
        mnemonic, operands = macroinstr.get_mnemonic_and_operands()
        for index, operand in enumerate(operands):
            if operand in argmap:
                operands[index] = argmap[operand]
        if mnemonic in argmap:
            mnemonic = argmap[mnemonic]
        resultlines.append(Instruction(
            (mnemonic + " " + ", ".join(operands)).strip(),
            instr.linenum,
        ))

    return resultlines


def expand_recursive_macros(
    macros: dict[str, tuple[list[str], list[Instruction]]]
) -> dict[str, tuple[list[str], list[Instruction]]]:
    """Expand nested macros into assembly instructions only"""

    completemacros = {}
    iterations = len(macros) + 2  # Stop in case of infinite recursion

    while len(macros) > 0:
        for macroname in list(macros.keys()).copy():  # This feels a bit ugly
            successful = True
            newinstrlist = []

            # Loop through all instructions, substituting when necessary
            for instr in macros[macroname][1]:
                if instr.is_macro():
                    # Nested macro - wait until fully expanded
                    if instr.text.split("(")[0] not in completemacros:
                        successful = False
                        break
                    # Able to substitute macro immediately
                    newinstrlist.extend(process_function_macro(
                        instr,
                        completemacros[instr.get_macro_name()]
                    ))
                # Regular instruction
                else:
                    newinstrlist.append(instr)

            # If the macro has been fully expanded, add to completemacros and
            # remove from macros dict
            if successful:
                completemacros[macroname] = (
                    macros[macroname][0],
                    newinstrlist
                )
                macros.pop(macroname)

        # There is an infinite loop if and only if the number of iterations is
        # more than the number of macros (this implies a circular dependency)
        iterations -= 1
        if iterations <= 0:
            raise AssemblerError(
                "Infinite recursion while parsing macros"
            ) from None

    return completemacros


def replace_function_macros(
    lines: list[Instruction],
    macros: dict[str, tuple[list[str], list[Instruction]]]
) -> list[Instruction]:
    """Apply function macros to a list of instructions"""

    resultlines = []
    for instr in lines:
        # Label - ignore
        if instr.is_label():
            resultlines.append(instr)
            continue

        # Macro
        if instr.is_macro():
            resultlines.extend(process_function_macro(
                instr,
                macros[instr.get_macro_name()]
            ))

        # Regular instruction
        else:
            resultlines.append(instr)

    return resultlines


def apply_macros(lines: list[Instruction]) -> list[Instruction]:
    """Apply all macros to a list of instructions"""

    result, stringmacros, functionmacros = find_macros(lines)
    functionmacros = expand_recursive_macros(functionmacros)
    result = replace_function_macros(result, functionmacros)
    result = replace_string_macros(result, stringmacros)
    return result
