from .formats import Instruction

from .preprocessor.preprocess import preprocess
from .translator.translate import translate


def assemble(lines: list[Instruction]) -> list[str]:
    """Assemble assembly source code to machine code"""

    lines = preprocess(lines)
    lines = translate(lines)
    return lines
