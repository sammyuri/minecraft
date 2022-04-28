from minecraft.combine import get_assembly, get_world
from assembler.preprocessor import preprocess
from assembler.translator import translate
from assembler.formats import Instruction
from emulator.emulator import Chungus2
from schemgenerator.schem import generate_schematic

import time


if __name__ == "__main__":
    lines = get_assembly()
    lines = [Instruction(line, index) for index, line in enumerate(lines)]
    lines = preprocess.preprocess(lines)
    lines = translate.translate(lines)
    chungus = Chungus2(lines)
    chungus.set_ram(get_world())
    print(chungus.run_program(100000000))
    time.sleep(100)