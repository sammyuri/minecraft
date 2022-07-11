from minecraft.combine import get_assembly, get_world
from assembler.preprocessor import preprocess
from assembler.translator import translate
from assembler.formats import Instruction
from emulator.emulator import Chungus2
from schemgenerator.schem import generate_schematic

import time


if __name__ == "__main__":
    lines = []
    with open("chasm_scripts/ports.s", "r") as f:
        for line in f:
            lines.append(line.strip())
    with open("chasm_scripts/constants.s", "r") as f:
        for line in f:
            lines.append(line.strip())
    with open("chasm_scripts/bank1.s", "r") as f:
        for line in f:
            lines.append(line.strip())
    with open("chasm_scripts/bank2.s", "r") as f:
        for line in f:
            lines.append(line.strip())
    print(lines)
    lines = [Instruction(line, index) for index, line in enumerate(lines)]
    lines = preprocess.preprocess(lines)
    if True:
        lines = lines[0:2048]  # bank 1
        lines = translate.translate(lines)
        generate_schematic(lines, "bank1")
    else:
        lines = lines[2048:]  # bank 2
        lines = translate.translate(lines)
        generate_schematic(lines, "bank2")
    # chungus = Chungus2(lines)
    # chungus.set_ram(get_world())
    # print(chungus.run_program(100000000))
    # time.sleep(100)