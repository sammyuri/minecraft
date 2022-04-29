from .comments import remove_comments
from .macros import apply_macros
from .pager import parse_pages
from .labels import parse_labels
from .relatives import parse_relatives

from ..formats import Instruction


def preprocess(lines: list[Instruction]) -> list[Instruction]:

    """
    Preprocess a list of instructions

    Removes comments and empty lines, applies macros, splits into pages of 64
    instructions, parses labels, and parses relatives, resulting in a list of assembly
    instructions only.
    """

    lines = remove_comments(lines)
    lines = apply_macros(lines)
    lines = parse_pages(lines)
    lines = parse_labels(lines)
    lines = parse_relatives(lines)
    return lines
