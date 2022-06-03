from timeit import default_timer as timer
from sys import argv, stderr
from os.path import isfile
import os
from typing import Tuple, Union
script_dir = os.path.dirname(__file__)  # <-- absolute dir the script is in

usage = """usage: python compiler2 <source_file> <destination_file>"""
imm_prefix = "imm:"

def main():
    source = argv[1] if len(argv) >= 2 else 'debug_test.urcl'  
    dest = argv[2] if len(argv) >= 3 else None;
    
    output = None
    text: str
    if source.startswith(imm_prefix):
        text = source[imm_prefix.__len__():]
    else:
        if isfile(source):
            with open(source, mode='r') as sf:
                text = sf.read()
        else:
            print(f"couldn't find source file: {source}")
            print(usage)
            exit(1)

    output = compiler(text.replace("\r", " ") + "\n")
    errors: str = ""
    out: str = ""

    if type(output) is tuple:
        out, errors = output
    else:
        print(errors, stderr)

        
    if output == None:
        print("Failed to compile program", stderr)
        print(usage, stderr)
        exit(1)
        
    
    if (dest):
        if isfile(dest):
            with open(dest, mode='w') as df:
                df.write(out)
                print(f"Saved program to {dest}")
        else:
            print(f"couldn't find destination file: {dest}")
    else:
        print(out)
    
    # print(usage)
    

CRED = '\033[91m'
CGREEN = '\033[32m'
CEND = '\033[0m'
allowed_chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
memory_instructions = {'LOD', 'LLOD', 'STR', 'LSTR', 'CPY'}
conditional_instructions = {'IF', 'ELIF', 'WHILE', 'BITS'}
scope_instructions = {'IF', 'FOR', 'WHILE', 'SWITCH'}

multiword_instructions = {'LOD', 'LLOD', 'STR', 'LSTR', 'JMP', 'CPY', 'BGE', 'BRE', 'BNE', 'BRL', 'BRG', 'BLE', 'BZR',
                          'BNZ', 'BRN', 'BRP', 'BEV', 'BOD', 'CAL', 'BRC', 'BNC', 'DW'}

branch_instructions = {'JMP', 'BGE', 'BRE', 'BNE', 'BRL', 'BRG', 'BLE', 'BZR', 'BNZ', 'BRN', 'BRP', 'BEV', 'BOD', 'CAL',
                       'BRC', 'BNC'}

relative_accepting_instructions = {'JMP', 'BGE', 'BRE', 'BNE', 'BRL', 'BRG', 'BLE', 'BZR', 'BNZ', 'BRN', 'BRP', 'BEV',
                                   'BOD', 'CAL', 'BRC', 'BNC', 'PSH'}

port_names = {'CPUBUS', 'TEXT', 'NUMB', 'SUPPORTED', 'SPECIAL', 'PROFILE', 'X', 'Y', 'COLOR', 'BUFFER', 'G-SPECIAL',
              'ASCII', 'CHAR5', 'CHAR6', 'ASCII7', 'UTF8', 'UTF16', 'UTF32', 'T-SPECIAL', 'INT', 'UINT', 'BIN', 'HEX',
              'FLOAT', 'FIXED', 'N-SPECIAL', 'ADDR', 'BUS', 'PAGE', 'S-SPECIAL', 'RNG', 'NOTE', 'INSTR', 'NLEG', 'WAIT',
              'NADDR', 'DATA', 'M-SPECIAL', 'UD1', 'UD2', 'UD3', 'UD4', 'UD5', 'UD6', 'UD7', 'UD8', 'UD9', 'UD10',
              'UD11', 'UD12', 'UD13', 'UD14', 'UD15', 'UD16'}


def compiler(source) -> Union[str, Tuple[str, str]]:
    start = timer()
    # setup on the program
    source = remove_comments(source)  # removes comments inline or multi line
    source = source.replace(',', '')  # removes commas from the program to maximise compatibility with old programs
    lines = source.split('\n')
    lines = remove_indent_spaces(lines)
    lines = label_generator(lines)

    instructions = []
    errors = ''

    # setup on library
    lib_code = '\nJMP .reserved_endFile\n\n'
    headers = set()  # 'bits', 'minreg', 'minheap', 'run', 'minstack'
    bits_head = '>= 8'

    imported_libraries = set()
    called_lib_functions = set()

    # other setups
    macros = {
        '@BITS': '8',
        '@MINREG': '8',
        '@MINHEAP': '16',
        '@MINSTACK': '8',
        '@MSB': '-128',
        '@SMSB': '64',
        '@MAX': '-1',
        '@SMAX': '127',
        '@UHALF': '-16',
        '@LHALF': '15',
    }

    labels, label_errors = label_recogniser(lines)
    errors += label_errors

    line_nr = 0
    while line_nr < len(lines):
        line = lines[line_nr]
        if line == '':
            line_nr += 1
            continue

        # # # # # # # # # # # # # # # Labels # # # # # # # # # # # # # # #

        if line.startswith('.'):
            instructions.append(line)
            line_nr += 1
            continue

        # # # # # # # # # # # # # # # Instructions # # # # # # # # # # # # # # #

        # big work on instructions starts here :/
        parts = line.split(' ', 1)  # dividing instruction into opcode and operands
        opcode = parts[0]
        try:
            operands_str = parts[1]
        except IndexError:
            operands_str = ''
        operand_count = opcode_op_count(opcode)  # return num of operands of instruction, or YEET if URCLpp/Header/Error
        operands = []

        # # # # # # # # # # # # # # # Library function Calls # # # # # # # # # # # # # # #

        if '(' in operands_str or ')' in operands_str:  # this char is only used in lib calls so it must be func/Error
            if opcode != 'LCAL':  # there is no other instruction that uses parenthesis so it must be an Error
                print(CRED + "Illegal Char Error: '(' used at line " + str(line_nr) + CEND)
                errors += f"-Illegal Char Error: '(' used at line {str(line_nr)}\n"

            if operands_str.count('(') != 1 or operands_str.count(')') != 1:  # only 1 pair of parenthesis allowed
                print(CRED + "Syntax Error: Faulty function Call at line " + str(line_nr) + CEND)
                errors += f"-Syntax Error: Faulty function Call at line {str(line_nr)}\n"
                break

            args_str = operands_str[(operands_str.index('(') + 1):operands_str.index(')')]
            args = args_str.split(' ')
            for arg in args:
                if arg[0] == '@':
                    if arg in macros:
                        arg = macros[arg]
                        operand_type = operand_type_of(arg)

                        if operand_type not in {'imm', 'label', 'mem', 'char', 'port', 'rel'}:
                            print(CRED + "Syntax Error: Invalid macro type passed at line " + str(line_nr) + CEND)
                            errors += f"-Syntax Error: Invalid macro type passed at line {str(line_nr)}\n"
                    else:
                        print(CRED + "Syntax Error: Undefined macro used at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Undefined macro used at line {str(line_nr)}\n"

            operands.append(operands_str[0:operands_str.index('(')])
            operands.append(args_str)

        # # # # # # # # # # # # # # # Multiword on the operands # # # # # # # # # # # # # # #

        elif '[' in operands_str or ']' in operands_str:
            if opcode not in multiword_instructions:
                if '[' in operands_str and ']' in operands_str:
                    print(CRED + "Syntax Error: The instruction '" + opcode + "' doesnt support multiword, at line " +
                          str(line_nr) + CEND)
                    errors += f"-Illegal Char Error: '[' or ']' used at line {str(line_nr)}\n"
                else:
                    print(CRED + "Illegal Char Error: '[' or ']' used at line " + str(line_nr) + CEND)
                    errors += f"-Illegal Char Error: '[' or ']' used at line {str(line_nr)}\n"

            args_str = operands_str[(operands_str.index('[') + 1):operands_str.index(']')]
            other_operands = operands_str.replace(f'[{args_str}]', '')
            checked_args = []
            for arg in args_str.split(' '):  # replace macros that are inside the multiword
                if arg[0] == '@':
                    if arg in macros:
                        arg = macros[arg]
                        operand_type = operand_type_of(arg)

                        if operand_type not in {'imm', 'label', 'reg', 'char'}:
                            print(CRED + "Syntax Error: Invalid macro type used at line " + str(line_nr) + CEND)
                            errors += f"-Syntax Error: Invalid macro type used at line {str(line_nr)}\n"

                        else:
                            arg = macros[arg]

                    else:
                        print(CRED + "Syntax Error: Undefined macro used at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Undefined macro used at line {str(line_nr)}\n"

                checked_args.append(arg)

            args_str = f'[{" ".join(checked_args)}]'

            if opcode == 'DW':
                instructions.append(f'DW {args_str}')
                line_nr += 1
                continue

            else:
                operands = other_operands[1:].split(' ')

                if other_operands[0] == ' ':  # multiword is the first operand
                    operands.insert(0, args_str)

                else:  # multiword is the second operand
                    operands.insert(1, args_str)

        # # # # # # # # # # # # # # # String as a multiword operand on DW # # # # # # # # # # # # # # #

        elif '"' in operands_str:
            if opcode != 'DW' and operands_str.count('"') == 2:  # strings must be in the form of a multiword DW
                print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                      CEND)
                errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"

            elif operands_str.count('"') != 2:
                print(CRED + "Illegal Char Error: '\"' used at line " + str(line_nr) + CEND)
                errors += f"-Illegal Char Error: '\"' used at line {str(line_nr)}\n"

            else:
                string_ = operands_str[operands_str.index('"') + 1:operands_str.rindex('"')]
                split_string = list(string_)
                length = len(string_)
                final_operand = f'[{str(length)} '
                for char in split_string:
                    final_operand += f"'{char}' "

                final_operand = final_operand[:-1] + ']'
                instructions.append('DW ' + final_operand)
                line_nr += 1
                continue

        # # # # # # # # # # # # # # # Operand prefixes # # # # # # # # # # # # # # #

        else:
            operands = operands_str.split(' ')

        valid_operands = []
        # for some reason, arg is already defined here wtf
        for arg in operands:
            try:
                operand_type = operand_type_of(arg)
            except IndexError:
                line_nr += 1
                continue

            if opcode == 'LCAL' or opcode == 'IMPORT':  # LCAL has its operands sorted already
                valid_operands.append(arg)

            elif operand_type == 'ERROR':  # its not a valid operand
                print(CRED + "Syntax Error: Unknown operand type used at line " + str(line_nr) + CEND)
                errors += f"-Syntax Error: Unknown operand type used at line {str(line_nr)}\n"

            elif operand_type in {'imm', 'reg'}:
                valid_operands.append(arg)

            elif operand_type == 'mem':
                if opcode in memory_instructions:
                    valid_operands.append(arg)
                else:
                    print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                          CEND)
                    errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"

            elif operand_type == 'label':
                if ' ' in arg:
                    pass
                else:
                    if arg in labels:
                        valid_operands.append(arg)
                    else:
                        print(CRED + "Syntax Error: Unknown label used at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Unknown label used at line {str(line_nr)}\n"

            elif operand_type == 'rel':
                if opcode in relative_accepting_instructions:
                    valid_operands.append(arg)
                else:
                    print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                          CEND)
                    errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"

            elif operand_type == 'port':
                if opcode in {'IN', 'OUT'}:
                    if operand_type[1:].isnumeric():
                        valid_operands.append(arg)

                    elif operand_type[1:] in port_names:
                        valid_operands.append(arg)
                    else:
                        print(CRED + "Syntax Error: Unknown Port name used at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Unknown Port name used at line {str(line_nr)}\n"
                else:
                    print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                          CEND)
                    errors += f"-Syntax Error: Wrong operand type for '" + opcode + "' used at line {str(line)}\n"

            elif operand_type == 'char':
                if arg[1:].index("'") == 2:  # special chars like \n or \t or error
                    if arg[1:3] in {'\\n', '\\t', '\\r', '\\b', '\\v', '\\0'}:
                        valid_operands.append(arg)
                    else:
                        print(CRED + "Syntax Error: Unknown operand type used at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Unknown operand type used at line {str(line_nr)}\n"

                elif len(arg) == 3 and arg[2] == "'":  # normal char
                    valid_operands.append(arg)
                else:
                    print(CRED + "Syntax Error: Unknown operand type used at line " + str(line_nr) + CEND)
                    errors += f"-Syntax Error: Unknown operand type used at line {str(line_nr)}\n"

            elif operand_type == 'cnd':
                if opcode in conditional_instructions:
                    valid_operands.append(arg)
                else:
                    print(CRED + "Syntax Error: Wrong operand type for  '" + opcode + "' used at line " + str(line_nr)
                          + CEND)
                    errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"

            elif operand_type == 'macro':
                if opcode == '@define':
                    if operands.index(arg) == 1:  # its declaring a macro based on another macro, and that is a no :P
                        print(CRED + "Syntax Error: Wrong operand type for second operand in '" + opcode +
                              "' used at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Wrong operand type for second operand in '{opcode}' used " \
                                  f"at line {str(line_nr)}\n"
                    else:
                        valid_operands.append(arg)

                elif arg in macros:
                    arg = macros[arg]
                    operand_type = operand_type_of(arg)
                    args_str = macro_operand_valid(operand_type, opcode, line_nr)

                    if args_str == '':
                        valid_operands.append(arg)
                    else:
                        errors += args_str
                        break

                else:
                    print(CRED + "Syntax Error: Undefined macro used at line " + str(line_nr) + CEND)
                    errors += f"-Syntax Error: Undefined macro used at line {str(line_nr)}\n"

        operands = valid_operands

        # # # # # # # # # # # # # # # First Operand type checks # # # # # # # # # # # # # # #

        if operand_count != 'ERROR':  # then its a main URCL instruction
            try:
                destination_operand_type = operand_type_of(operands[0])
            except IndexError:
                line_nr += 1
                continue

            if destination_operand_type not in {'reg', 'port', 'rel', 'label', 'mem'}:  # operand 1 must be address/reg
                if destination_operand_type == 'imm' and opcode in memory_instructions:
                    print(CRED + "Warning: Immediate values should NOT be used as addresses in memory instructions at "
                                 "line " + str(line_nr) + CEND)
                    errors += f"-Warning: Immediate values should NOT be used as addresses in memory instructions at " \
                              f"line {str(line_nr)}\n"

                elif destination_operand_type == 'imm' and opcode in branch_instructions:
                    print(CRED + "Warning: Immediate values should NOT be used as addresses in Branch instructions at "
                                 "line " + str(line_nr) + CEND)
                    errors += f"-Warning: Immediate values should NOT be used as addresses in Branch instructions at " \
                              f"line {str(line_nr)}\n"

                elif destination_operand_type == 'imm' and opcode == 'PSH':  # this is the only exception to the rule
                    pass

                else:
                    print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                          CEND)
                    errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"
                    break

            else:
                if opcode in {'STR', 'LSTR', 'CPY'} and destination_operand_type not in {'mem', 'reg'}:
                    print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                          CEND)
                    errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"

                elif opcode in branch_instructions and destination_operand_type not in {'rel', 'reg', 'label'}:
                    print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                          CEND)
                    errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"

                elif opcode == 'OUT' and destination_operand_type != 'port':
                    print(CRED + "Syntax Error: Wrong operand type for '" + opcode + "' used at line " + str(line_nr) +
                          CEND)
                    errors += f"-Syntax Error: Wrong operand type for '{opcode}' used at line {str(line_nr)}\n"

        # # # # # # # # # # # # # # # Opcodes # # # # # # # # # # # # # # #

        if operand_count == 'ERROR':  # can be an Error, header or an URCLpp exclusive instruction
            operand_count = new_opcode_op_count(opcode)

            if operand_count == 'ERROR':  # its not an URCLpp instruction neither, so its either an error or header
                operand_count = check_headers(opcode)

                if operand_count == 'ERROR':  # its not an header neither, meaning its an error
                    print(CRED + "Syntax Error: Unknown instruction at line " + str(line_nr) + CEND)
                    errors += f"-Syntax Error: Unknown instruction at line {str(line_nr)}\n"

                # # # # # # # # # # # # # # # Headers # # # # # # # # # # # # # # #

                else:
                    if operand_count != len(operands):
                        print(CRED + "Syntax Error: Wrong number of operands in Header at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Wrong number of operands in Header at line {str(line_nr)}\n"
                    else:

                        if opcode == 'BITS':
                            if 'bits' in headers:
                                print(CRED + "Syntax Error: More than 1 'BITS' header at line " + str(line_nr) + CEND)
                                errors += f"-Syntax Error: More than 1 'BITS' header at line {str(line_nr)}\n"

                            else:
                                headers.add('bits')
                                macros['@BITS'] = operands[1]
                                macros['@MSB'] = str(-(2 ** (int(operands[1]) - 1)))
                                macros['@SMSB'] = str(2 ** (int(operands[1]) - 2))
                                macros['@SMAX'] = str((2 ** (int(operands[1]) - 1)) - 1)
                                macros['@UHALF'] = str(-(2 ** (int(operands[1]) // 2)))
                                macros['@LHALF'] = str((2 ** (int(operands[1]) // 2)) - 1)
                                bits_head = operands_str
                                instructions.append("BITS " + bits_head)
                        elif opcode == 'MINREG':
                            if 'minreg' in headers:
                                print(CRED + "Syntax Error: More than 1 'MINREG' header at line " + str(line_nr) + CEND)
                                errors += f"-Syntax Error: More than 1 'MINREG' header at line {str(line_nr)}\n"

                            else:
                                headers.add('minreg')
                                macros['@MINREG'] = operands[0]
                                instructions.append("MINREG " + operands[0])

                        elif opcode == 'MINHEAP':
                            if 'minheap' in headers:
                                print(CRED + "Syntax Error: More than 1 'MINHEAP' header at line " + str(line_nr) +
                                      CEND)
                                errors += f"-Syntax Error: More than 1 'MINHEAP' header at line {str(line_nr)}\n"

                            else:
                                headers.add('minheap')
                                macros['@MINHEAP'] = operands[0]
                                instructions.append("MINHEAP " + operands[0])

                        elif opcode == 'RUN':
                            if 'run' in headers:
                                print(CRED + "Syntax Error: More than 1 'RUN' header at line " + str(line_nr) + CEND)
                                errors += f"-Syntax Error: More than 1 'RUN' header at line {str(line_nr)}\n"

                            else:
                                headers.add('run')
                                macros['@RUN'] = operands[0]
                                instructions.append("RUN " + operands[0])

                        elif opcode == 'MINSTACK':
                            if 'minstack' in headers:
                                print(CRED + "Syntax Error: More than 1 'MINSTACK' header at line " + str(line_nr) +
                                      CEND)
                                errors += f"-Syntax Error: More than 1 'MINSTACK' header at line {str(line_nr)}\n"

                            else:
                                headers.add('minstack')
                                macros['@MINSTACK'] = operands[0]
                                instructions.append("MINSTACK " + operands[0])

                        elif opcode == 'IMPORT':
                            lib_name = operands[0]
                            if not os.path.isdir(script_dir + r'/Libraries/' + lib_name):
                                print(CRED + "Syntax Error: Unknown library at line " + str(line_nr) + CEND)
                                errors += f"-Syntax Error: Unknown library at line {str(line_nr)}\n"

                            elif lib_name in imported_libraries:
                                print(CRED + "Warning: Library already imported in previous statement at line " +
                                      str(line_nr) + CEND)
                                errors += f"-Warning: Library already imported in previous statement at line " \
                                          f"{str(line_nr)}\n"
                            else:
                                imported_libraries.add(lib_name)

            # # # # # # # # # # # # # # # URCLpp instructions # # # # # # # # # # # # # # #

            else:  # its a URCLpp exclusive instruction

                # # # # # # # # # # # # # # # Conditionals # # # # # # # # # # # # # # #

                if opcode == 'IF':
                    try:
                        branch = condition_translator(operands[1])
                    except IndexError:
                        branch = 'BRZ'
                    label = associate_instructions(lines[line_nr + 1:], opcode)
                    if label == 'Missing END':
                        label = '.reserved_endFile'
                    elif label == 'ERROR':
                        print(CRED + "Syntax Error: Too many END used (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Too many END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    labels.add(label)
                    try:
                        instructions.append(f'{branch} {label} {operands[0]} {operands[2]}')
                    except IndexError:
                        instructions.append(f'{branch} {label} {operands[0]}')
                    index = lines.index(label)
                    label = associate_end(lines[line_nr + 1:])
                    labels.add(label)
                    lines.insert(index, f'JMP {label}')

                elif opcode == 'ELIF':
                    try:
                        branch = condition_translator(operands[1])
                    except IndexError:
                        branch = 'BRZ'
                    label = associate_instructions(lines[line_nr + 1:], opcode)
                    if label == 'Missing END':
                        label = '.reserved_endFile'
                    elif label == 'ERROR':
                        print(CRED + "Syntax Error: Too many END used (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Too many END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    labels.add(label)
                    try:
                        instructions.append(f'{branch} {label} {operands[0]} {operands[2]}')
                    except IndexError:
                        instructions.append(f'{branch} {label} {operands[0]}')
                    index = lines.index(label)
                    label = associate_end(lines[line_nr + 1:])
                    labels.add(label)
                    lines.insert(index, f'JMP {label}')

                # # # # # # # # # # # # # # # Loops # # # # # # # # # # # # # # #

                elif opcode == 'FOR':
                    try:
                        value = operands[2]
                    except IndexError:
                        value = '1'

                    label = associate_instructions(lines[line_nr + 1:], opcode)
                    if label == 'Missing END':
                        print(CRED + "Syntax Error: Missing END (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Missing END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    elif label == 'ERROR':
                        print(CRED + "Syntax Error: Too many END used (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Too many END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    labels.add(label)
                    instructions.append(f'BRE {label} {operands[0]} {operands[1]}')
                    index = lines.index(label)
                    label = lines[line_nr - 1]
                    lines.insert(index, f'JMP {label}')
                    if value == '0':  # for loop cant have a 0, right?
                        break
                    elif value == '1':
                        lines.insert(index, f'INC {operands[0]} {operands[0]}')
                    elif value == '-1':
                        lines.insert(index, f'DEC {operands[0]} {operands[0]}')
                    else:
                        lines.insert(index, f'ADD {operands[0]} {operands[0]} {value}')

                elif opcode == 'WHILE':
                    try:
                        branch = condition_translator(operands[1])
                    except IndexError:
                        branch = 'BRZ'

                    label = associate_instructions(lines[line_nr + 1:], opcode)
                    if label == 'Missing END':
                        print(CRED + "Syntax Error: Missing END (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Missing END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    elif label == 'ERROR':
                        print(CRED + "Syntax Error: Too many END used (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Too many END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    labels.add(label)
                    try:
                        instructions.append(f'{branch} {label} {operands[0]} {operands[2]}')
                    except IndexError:
                        instructions.append(f'{branch} {label} {operands[0]}')
                    index = lines.index(label)
                    label = lines[line_nr - 1]
                    lines.insert(index, f'JMP {label}')

                elif opcode == 'SWITCH':

                    if operands[0][0] != 'R' and operands[0][0] != '$':
                        print(CRED + "Syntax Error: Wrong operand type at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Wrong operand type at line {str(line_nr)}\n"

                    label = associate_instructions(lines[line_nr + 1:], opcode)
                    if label == 'Missing END':
                        print(CRED + "Syntax Error: Missing END (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Missing END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    elif label == 'ERROR':
                        print(CRED + "Syntax Error: Too many END used (incorrect scope) at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Too many END used (incorrect scope) at line {str(line_nr)}\n"
                        return errors
                    labels.add(label)
                    index = lines.index(label)
                    n_errors, n_labels, code = build_switch(lines[line_nr + 1:], lines[line_nr - 1], label, operands[0])
                    errors += n_errors
                    labels |= n_labels
                    lines = lines[:line_nr - 1] + code + lines[index + 2:]
                    line_nr -= 2
                    instructions.pop()

                # # # # # # # # # # # # # # # Defining Macros # # # # # # # # # # # # # # #

                elif opcode == '@define':
                    macros[operands[0]] = operands[1]

                # # # # # # # # # # # # # # # Library Call # # # # # # # # # # # # # # #

                elif opcode == 'LCAL':
                    if '(' not in operands_str:
                        print(CRED + "Syntax Error: Faulty library call at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Faulty library call at line {str(line_nr)}\n"
                        break

                    lib = operands[0]
                    lib = lib.replace('.', '/')
                    lib_name = lib.split('/', 1)[0]
                    rel_path = r"/Libraries/" + lib + '.urcl'
                    abs_file_path = script_dir + rel_path
                    if lib_name not in imported_libraries:
                        print(CRED + "Syntax Error: Library not imported at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Library not imported at line {str(line_nr)}\n"

                    if os.path.isfile(abs_file_path):
                        lib = lib.replace('/', '_')
                        lib_output = lib_importer(abs_file_path, [bits_head, macros['@MINREG']], operands[1], lib)
                        
                        if lib not in called_lib_functions:
                            called_lib_functions.add(lib)

                            lib_code += lib_output[0] + '\n'  # having an empty line for readability

                        instructions.append('\n' + lib_helper(operands[1], lib_output[1], lib, lib_output[2]))

                    else:
                        print(CRED + "Syntax Error: Unknown library at line " + str(line_nr) + CEND)
                        errors += f"-Syntax Error: Unknown library at line {str(line_nr)}\n"

        # # # # # # # # # # # # # # # Main URCL instruction # # # # # # # # # # # # # # #

        else:  # its a normal instruction
            if operand_count != len(operands):  # either wrong number of operands or use smart typing
                if operand_count - 1 == len(operands):  # smart typing it is
                    instructions.append(opcode + ' ' + str(operands[0]) + ' ' + (' '.join(operands)))
                else:
                    print(CRED + "Syntax Error: Wrong number of operands at line " + str(line_nr) + CEND)
                    errors += f"-Syntax Error: Wrong number of operands at line {str(line_nr)}\n"
            else:  # normal instruction here
                instructions.append(opcode + ' ' + (' '.join(operands)))

        line_nr += 1

    final_program = ''
    for line in instructions:
        final_program += line + '\n'

    if len(called_lib_functions) != 0:
        final_program += lib_code

    final_program += '.reserved_endFile'

    end = timer()

    return final_program, errors


# # # # # # # # # # # # # # # Helper Functions below # # # # # # # # # # # # # # #



def remove_indent_spaces(lines):
    output = []
    for line in lines:
        i = 0
        if line == '':
            continue
        while line[i] == ' ':
            if i < len(line):
                i += 1
        output.append(line[i:])
    return output


def remove_comments(source):  # removes all inline comments and multiline comments from the program
    i = 0
    output = ''
    commented = False
    while i < len(source):
        if commented:
            try:
                if source[i] == '*' and source[i + 1] == '/':
                    i += 2
                    commented = False
            except IndexError:
                pass
        else:
            try:
                if source[i] == '/' and source[i + 1] == '*':
                    i += 2
                    commented = True
                    continue
                else:
                    if source[i] == '/' and source[i + 1] == '/':
                        i += 2
                        while source[i] != '\n':
                            i += 1
            except IndexError:
                pass
            output += source[i]

        i += 1
    return output


def opcode_op_count(opcode):  # checks if the opcode is correct and returns the number of operands expected
    operands = {
        # CORE
        'ADD': 3,
        'RSH': 2,
        'LOD': 2,
        'STR': 2,
        'BGE': 3,
        'NOR': 3,
        'IMM': 2,
        # I/O
        'IN': 2,
        'OUT': 2,
        # BASIC
        'SUB': 3,
        'JMP': 1,
        'MOV': 2,
        'NOP': 0,
        'LSH': 2,
        'INC': 2,
        'DEC': 2,
        'NEG': 2,
        'AND': 3,
        'OR': 3,
        'NOT': 2,
        'XOR': 3,
        'XNOR': 3,
        'NAND': 3,
        'BRE': 3,
        'BNE': 3,
        'BRL': 3,
        'BRG': 3,
        'BLE': 3,
        'BZR': 2,
        'BNZ': 2,
        'BRN': 2,
        'BRP': 2,
        'BEV': 2,
        'BOD': 2,
        'PSH': 1,
        'POP': 1,
        'CAL': 2,
        'RET': 0,
        'HLT': 0,
        'CPY': 2,
        'BRC': 3,
        'BNC': 3,
        # COMPLEX
        'MLT': 3,
        'DIV': 3,
        'MOD': 3,
        'BSR': 3,
        'BSL': 3,
        'SRS': 2,
        'BSS': 3,
        'SETE': 3,
        'SETNE': 3,
        'SETL': 3,
        'SETG': 3,
        'SETLE': 3,
        'SETGE': 3,
        'SETC': 3,
        'SETNC': 3,
        'LLOD': 3,
        'LSTR': 3,
        # Directives
        'DW': 1
    }
    try:
        operand_count = operands[opcode]
    except KeyError:
        operand_count = 'ERROR'

    return operand_count


def new_opcode_op_count(opcode):
    operands = {
        # urcl++ exclusive below
        'LCAL': 2,
        '@define': 2,
        'IF': 3,
        'ELIF': 3,
        'ELSE': 3,
        'FOR': 3,
        'WHILE': 3,
        'SWITCH': 1,
        'CASE': 1,
        'END': 0,
    }
    try:
        operand_count = operands[opcode]
    except KeyError:
        operand_count = 'ERROR'

    return operand_count


def check_headers(header_name):
    header = {
        'IMPORT': 1,
        'BITS': 2,
        'MINREG': 1,
        'MINHEAP': 1,
        'RUN': 1,
        'MINSTACK': 1,
    }
    try:
        operant_count = header[header_name]
    except KeyError:
        operant_count = 'ERROR'

    return operant_count


def operand_type_of(operand):
    if operand.isnumeric():  # then its an IMM
        return 'imm'

    elif operand == 'SP':  # sp is a valid operand
        return 'reg'

    else:
        prefix = operand[0]
        op_type = {
            'R': 'reg',
            '$': 'reg',
            '#': 'mem',
            'M': 'mem',
            '%': 'port',
            '.': 'label',
            '+': 'imm',
            '-': 'imm',
            '@': 'macro',
            '~': 'rel',
            "'": 'char',
            '=': 'cnd',
            '!': 'cnd',
            '<': 'cnd',
            '>': 'cnd',
            '(': 'arg',  # wont be used but its here anyways
            '[': 'multi',
            '"': 'string',
        }
        try:
            return op_type[prefix]
        except KeyError:
            return 'ERROR'


def label_recogniser(lines):
    labels = set()
    errors = ''

    for line_nr, line in enumerate(lines):
        if line.startswith('.'):
            i = 1
            while i < len(line):  # cannot contain illegal chars
                if line[i] not in allowed_chars:
                    print(CRED + "Illegal Char Error: '" + line[i] + "' used at line " + str(line_nr) + CEND)
                    errors += f"-Illegal Char Error: '{line[i]}' used at line {str(line_nr)}\n"
                i += 1
            if line in labels:  # cant have duplicates
                print(CRED + "Syntax Error: Duplicate label used at line " + str(line_nr) + CEND)
                errors += f"-Syntax Error: Duplicate label used at line {str(line_nr)}\n"
            else:  # all went well here :D
                labels.add(line)
    return [labels, errors]


def label_generator(lines):
    end_counter = 0
    elif_counter = 0
    else_counter = 0
    while_counter = 0
    for_counter = 0
    switch_counter = 0
    labels = []
    for line in lines:
        opcode = line.split(' ', 1)[0]
        if opcode == 'END':
            end_counter += 1
            labels.append(f'.reserved_end{end_counter}')

        elif opcode == 'ELIF':
            elif_counter += 1
            labels.append(f'.reserved_elif{elif_counter}')

        elif opcode == 'ELSE':
            else_counter += 1
            labels.append(f'.reserved_else{else_counter}')

        elif opcode == 'WHILE':
            while_counter += 1
            labels.append(f'.reserved_while{while_counter}')

        elif opcode == 'FOR':
            for_counter += 1
            labels.append(f'.reserved_for{for_counter}')

        elif opcode == 'SWITCH':
            switch_counter += 1
            labels.append(f'.reserved_switch{switch_counter}')

        labels.append(line)

    return labels


def macro_operand_valid(op_type, opcode, line_nr):
    errors = ''
    if op_type == 'ERROR':  # its not a valid operand
        print(CRED + "Syntax Error: Unknown operand type used at line " + str(line_nr) + CEND)
        errors += f"-Syntax Error: Unknown operand type used at line {str(line_nr)}\n"

    elif op_type == 'mem':
        if opcode not in memory_instructions:
            print(CRED + "Syntax Error: Wrong macro type for  '" + opcode + "' used at line " + str(line_nr) + CEND)
            errors += f"-Syntax Error: Wrong macro type for '{opcode}' used at line {str(line_nr)}\n"

    elif op_type == 'rel':
        if opcode not in relative_accepting_instructions:
            print(CRED + "Syntax Error: Wrong macro type for  '" + opcode + "' used at line " + str(line_nr) + CEND)
            errors += f"-Syntax Error: Wrong macro type for '{opcode}' used at line {str(line_nr)}\n"

    elif op_type == 'port':
        if opcode not in {'IN', 'OUT'}:
            print(CRED + "Syntax Error: Wrong macro type for '" + opcode + "' used at line " + str(line_nr) + CEND)
            errors += f"-Syntax Error: Wrong macro type for '" + opcode + "' used at line {str(line)}\n"

    elif op_type == 'cnd':
        if opcode not in conditional_instructions:
            print(CRED + "Syntax Error: Wrong macro type for '" + opcode + "' used at line " + str(line_nr) + CEND)
            errors += f"-Syntax Error: Wrong macro type for '" + opcode + "' used at line {str(line)}\n"

    elif op_type == 'mutli':
        pass

    else:  # if op_type in {'imm', 'reg', 'char'}:
        pass

    return errors


def latency(start, end):
    total_time = round((end - start)*1000)
    if total_time < 1:
        return '~0'
    else:
        return f'~{total_time}'


def lib_importer(abs_file_path, headers, args, lib_name):
    args = args[1:-1]
    args = args.split(' ')
    with open(abs_file_path) as f:
        lib_function = f.read()
        program = remove_comments(lib_function)
        program = program.replace(',', '')
        lines = program.split('\n')
        errors = ''

        lib_headers = [False, False, False, False]
        headers_done = False
        output = '.reserved_' + lib_name + '\n'
        regs_needed = 0
        output_regs = 0

        for line_num, line in enumerate(lines):
            part = line.split(' ', 1)
            if line == '':
                continue
            try:
                operands_str = part[1]
            except IndexError:
                pass
            operand = operands_str.split(' ')

            if headers_done:
                output += line + '\n'
            else:
                if line.startswith('BITS'):
                    lib_headers[0] = True
                    if bits_compatibility(operands_str, headers[0]):
                        print(CRED + "Compatibility Error: Incompatible library function" + CEND)
                        errors += f"-Compatibility Error: Incompatible library function"
                        return errors
                    

                elif line.startswith('OPS'):
                    lib_headers[1] = True
                    if int(operand[0]) < len(args):
                        print(CRED + "Type Error: Too many arguments given in library call at line " +
                              str(line_num) + CEND)
                        errors += f"-Type Error: Too many arguments given in library call at line " \
                                  f"{str(line_num)}\n"
                        return errors

                    elif int(operand[0]) > len(args):
                        print(CRED + "Type Error: Missing argument in library call at line " + str(line_num) +
                              CEND)
                        errors += f"-Type Error: Missing argument in library call at line {str(line_num)}\n"
                        return errors

                elif line.startswith('REG'):
                    lib_headers[2] = True
                    regs_needed = int(operand[0])
                    if int(headers[1]) < int(operand[0]):
                        print(CRED + "Type Error: Not enough registers available for library function" + CEND)
                        errors += f"-Type Error: Not enough registers available for library function"
                        return errors

                elif line.startswith('OUTS'):
                    lib_headers[3] = True
                    output_regs = operand[0]

                headers_done = lib_headers[0] and lib_headers[1] and lib_headers[2]

    return [output, regs_needed, output_regs]


def lib_helper(args, regs, lib_name, output_regs_num):
    args = args.split(' ')
    args_passed = ''
    args_removed = ''
    saved_regs = ''
    restored_regs = ''
    moved_regs = ''
    destination_regs = set()

    calling_instruction = 'CAL .reserved_' + lib_name + '\n'

    for num in range(int(output_regs_num)):
        if args[num][0] == 'R' or args[num][0] == '$':
            try:
                destination_regs.add(args[num][1:])
                if int(args[num][1:]) == num + 1:
                    continue
                moved_regs += f'MOV {args[num]} R{num + 1}\n'

            except IndexError:
                pass

    for reg in range(1, regs + 1):
        if str(reg) not in destination_regs:
            saved_regs += f'PSH R{reg}\n'

    args.reverse()
    for num in range(1, int(output_regs_num) + 1):
        args.pop()

    for arg in args:
        args_passed += f'PSH {arg}\n'
        args_removed += f'POP R0\n'

    for num in range(regs, 0, -1):
        if str(num) not in destination_regs:
            restored_regs += f'POP R{num}\n'

    return saved_regs + args_passed + calling_instruction + moved_regs + args_removed + restored_regs


def bits_compatibility(lib_header, header):
    header = header.split(' ', 1)

    for num in range(1, 65):
        if eval(header[1] + ' ' + header[0] + ' ' + str(num) + lib_header):
            return False

    return True


def associate_instructions(lines, instruction):
    scope = 0
    for line_num, line in enumerate(lines):
        line = line.split(' ', 1)
        opcode = line[0]

        if opcode in scope_instructions:
            scope += 1

        elif scope == 0:
            if instruction == 'IF' or instruction == 'ELIF':

                if opcode == 'ELIF' or opcode == 'ELSE' or opcode == 'END':
                    return lines[line_num - 1]

            elif opcode == 'END':
                return lines[line_num - 1]

        elif opcode == 'END':
            scope -= 1

        if scope < 0:
            return 'ERROR'

    return 'Missing END'


def associate_end(lines):
    scope = 0
    for line_num, line in enumerate(lines):
        line = line.split(' ', 1)
        opcode = line[0]

        if opcode in scope_instructions:
            scope += 1

        elif scope == 0:
            if opcode == 'END':
                return lines[line_num - 1]

        elif opcode == 'END':
            scope -= 1

        if scope < 0:
            return 'ERROR'

    return 'Missing END'


def condition_translator(condition):
    conditions = {  # WARNING: keep in mind that these are the opposite of what they should be
        '==': 'BNE',
        '!=': 'BRE',
        '<': 'BGE',
        '<=': 'BRG',
        '>': 'BLE',
        '>=': 'BRL',
    }
    return conditions[condition]


def build_switch(lines, switch_label, end, register):
    errors = ''
    scope = 0
    cases = set()
    labels = set()
    case_num = 0
    switch_number = switch_label[16:]
    default_done = False
    output = []
    switch = {}

    for line_nr, line in enumerate(lines):
        opcode = line.split(' ', 1)[0]
        try:
            operands_str = line.split(' ', 1)[1]
        except IndexError:
            continue

        if opcode in scope_instructions:
            scope += 1
            continue
        elif opcode == 'END':
            scope -= 1
            continue
        elif scope != 0:
            continue

        if opcode == 'CASE':
            operands = operands_str.split(' ')
            case_num += 1
            case_label = f'.reserved_case{switch_number}_{case_num}'
            labels.add(case_label)

            for operand in operands:
                if operand.isnumeric:
                    cases.add(int(operand))
                else:
                    print(CRED + "Syntax Error: Wrong operand type for CASE at line " + str(line_nr) + CEND)
                    errors += f"-Syntax Error: Wrong operand type for CASE at line {str(line_nr)}\n"
                switch[int(operand)] = case_label

            if len(output) > 0:
                output.append(f'JMP {end}')
            output.append(case_label)

        elif opcode == 'DEFAULT':
            default_done = True
            if len(output) > 0:
                output.append(f'JMP {end}')
            output.append(f'.reserved_default{switch_number}')
            labels.add(f'.reserved_default{switch_number}')

        else:
            output.append(line)

    output.append(end)
    biggest_case = None
    smallest_case = None

    for case in cases:
        try:
            if case > biggest_case:
                biggest_case = case

            elif case < smallest_case:
                smallest_case = case
        except TypeError:
            smallest_case = case
            biggest_case = case

    dw = []
    for number in range(biggest_case + 1):
        try:
            address = switch[number]
        except KeyError:
            if default_done:
                address = f'.reserved_default{switch_number}'
            else:
                address = end
        dw.append(address)

    dw = str(dw).replace(',', '')
    dw = dw.replace("'", '')
    output.insert(0, f'DW {dw}')

    output.insert(0, switch_label)
    output.insert(0, f'JMP {register}')
    output.insert(0, f'LLOD {register} {switch_label} {register}')

    if smallest_case != 0:
        output.insert(0, f'SUB {register} {register} {smallest_case}')
    output.insert(0, f'BRG {end} {register} {biggest_case}')

    return errors, labels, output

if __name__ == "__main__":
    main()
