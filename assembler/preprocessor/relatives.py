from ..formats import Instruction
import numpy

relativeLabelPrefix = ".assemblerRelativeLabel"
# if original assembly program has labels that start with this string, it may break

def parse_relatives(lines: list[Instruction]) -> list[Instruction]:
    """find all of the relative addresses and replace them with labels"""

    for line in lines: # scan through program to see if it contains the default relative label prefix.
        if line.is_label():
            if line.text[0:len(relativeLabelPrefix)] == relativeLabelPrefix:
                relativeLabelPrefix = line.text # if it does, set the prefix to it. That will ensure that the the labels are all unique.
    
    resultLines = []
    newLabels = []
    for index in range(len(lines)):
        mnemonic, operands = lines[index].get_mnemonic_and_operands() #extract operand data
        newOperands = []
        for operand in operands:
            if is_relative(operand):
                relative = int(operand[1:]) # isolate the relative position from the relative operand
                i, j = 0, 0
                dir = numpy.sign(relative) # check which direction to search in
                while i != relative: # search for correct location to insert label, ignoring preexisting lables
                    if lines[index + i + j].is_label():
                        j += dir
                    else:
                        i += dir
                label = relativeLabelPrefix + str(len(newLabels)) # generate a unique name for the new label
                newLabels.append(Instruction(label, index + i + j)) # save new label to insert later so this loop doesn't get messed up
                newOperands.append(label) # replace relative operand with label 
            else:
                newOperands.append(operand) # any non-relative operands are unchanged,
        resultLines.append(Instruction(
            (mnemonic + " " + ", ".join(newOperands)).strip(),
            index,
        ))
    
    newLabels.sort(reverse = True, key = sort_by_line_num) #sort the list of new labels to start at the end of the program and work backwards
    for lable in newLabels:
        resultLines.insert(lable.linenum, lable) # now that the loop is done, it's safe to insert the sorted labels

    return resultLines


def is_relative(operand) -> bool:
    return operand[:1] == "~"

def sort_by_line_num(e: Instruction) -> int:
    return e.linenum
