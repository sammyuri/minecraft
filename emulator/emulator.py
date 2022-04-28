from .instruction import Opcodes, MCInstruction, CPUError
from .alu import do_alu
from .ports import Ports


class CPUHalt(Exception):
    pass


class Chungus2:
    """Emulator of the CHUNGUS2 CPU"""
    def __init__(self, instructions: list[str] = []) -> None:
        # Reset CPU
        self.pmem = []
        self.ports = Ports()
        if len(instructions) > 0:
            self.load_instructions(instructions)

    def reset_cpu(self, ignoreram: bool = False) -> None:
        """Reset all flags, registers and RAM"""

        self.regs = [0] * 8
        self.callstack = []
        if not ignoreram:
            self.ram = [0] * 256

        self.cycles = 0  # Cycles elapsed
        self.pc = 0  # Program counter
        self.sp = 0  # Stack pointer
        self.poi = 0  # Pointer
        self.ep = False  # Extended pointer active

        self.carry = False  # Flags
        self.zero = False
        self.even = False

        self.loopcnt = 0  # Loop counter
        self.loopsrc = 0  # Loop source (end of loopm)
        self.loopdest = 0  # Loop destination (beginning of loop)

        self.abc = False  # Alternate (signed) branch conditions
        self.fnf = False  # Force no flags
        self.nextimm = 0  # LIM R0 immediate

    def load_instructions(self, instructions: list[str]) -> None:
        """Load a list of instructions to program memory"""

        self.pmem.clear()
        for instr in instructions:
            self.pmem.append(MCInstruction(binary=instr))

    def set_ram(self, ram: list[int]) -> None:
        """Set the initial values in RAM"""

        self.ram = ram.copy()
        self.ram.extend([0] * (256 - len(self.ram)))

    def condition_met(self, condition: int) -> bool:
        """Determine whether a condition is satisfied"""

        if condition == 0:  # TRUE
            return True
        if condition == 1:  # EVEN
            return self.even
        if condition == 2:  # GREATER
            return self.carry and not self.zero
        if condition == 3:  # LESS
            return not self.carry
        if condition == 4:  # ZERO
            return self.zero
        if condition == 5:  # NOT ZERO
            return not self.zero
        if condition == 6:  # GREATER EQUAL
            return self.carry
        if condition == 7:  # LESS EQUAL
            return not self.zero or self.carry

    def get_register(self, reg: int) -> int:
        """Return the value of a general purpose register"""
        return self.nextimm if reg == 0 else self.regs[reg]

    def set_flags_from_value(self, value: int) -> None:
        """Set the flags after a memory/ports load/store"""

        self.carry = False
        self.zero = (value == 0)
        self.even = (value % 2 == 0)

    def set_flags(self, flags: tuple[bool, bool, bool, bool]) -> None:
        """Update the ALU flags"""

        if self.fnf:  # Force no flags
            return
        self.zero = flags[1]
        self.even = flags[2]
        self.carry = flags[3] if self.abc else flags[0]

    def cycle(self) -> None:
        """Emulate a cycle"""

        # Halt automatically if PC exceeds instruction length
        if self.pc >= len(self.pmem):
            raise CPUError(
                f"PC exceeded program space ({self.pc} > {len(self.pmem) - 1})"
            ) from None

        self.cycles += 1
        instr = self.pmem[self.pc]

        branchtarget = None
        jumptarget = None
        updatepointer = False
        usenextimmediate = False
        updatesettings = False

        if instr.opcode == Opcodes.NOP:  # No-op
            pass

        elif instr.opcode == Opcodes.HLT:  # Halt
            raise CPUHalt(
                f"CPU halted on line {self.pc}"
            ) from None

        elif instr.opcode == Opcodes.STS:  # CPU settings
            if instr.a == 0:  # Use alternate branch conditions
                self.abc = True
                updatesettings = True
            elif instr.a == 1:  # Force no flags
                self.fnf = True
                updatesettings = True
            elif instr.a == 2:  # Set loop counter
                self.loopcnt = instr.immediate % 64
                self.loopdest = self.pc + 1
            elif instr.a == 3:  # Set loop source
                self.loopsrc = instr.immediate % 64 + self.pc // 64 * 64
            elif instr.a == 4:  # Set stack pointer
                self.cycles += 1
                self.sp = (instr.immediate + self.poi) % 256
            else:
                raise CPUError(
                    f"Unimplemented setting: {instr.a}"
                ) from None

        elif instr.opcode == Opcodes.CLI:
            taken = self.condition_met(instr.b)
            if taken and instr.a != 0:
                self.regs[instr.a] = instr.immediate
            elif taken:
                usenextimmediate = True
                self.nextimm = instr.immediate
            else:
                self.regs[instr.a] = 0

        elif instr.opcode == Opcodes.BRH:  # Conditional branch
            self.cycles += 1
            taken = self.condition_met(instr.a)
            if int(taken) != instr.type:  # Prediction failed
                self.cycles += 1
            if taken:
                branchtarget = instr.immediate

        elif instr.opcode == Opcodes.JMP:  # Jump
            self.cycles += 1
            jumptarget = instr.immediate

        elif instr.opcode == Opcodes.CAL:  # Call
            self.cycles += 1
            jumptarget = instr.immediate
            self.callstack.append(self.pc + 1)

        elif instr.opcode == Opcodes.RET:  # Return
            self.cycles += 1
            if len(self.callstack) < 1:
                raise CPUError(
                    "Attempted to return from empty call stack"
                ) from None
            jumptarget = self.callstack.pop()

        elif instr.opcode == Opcodes.POI:  # Pointer
            self.cycles += 1
            updatepointer = True
            self.poi = self.get_register(instr.c)
            if instr.type == 1:  # Check if extended pointer
                self.ep = True
            else:
                self.ep = False

        elif instr.opcode == Opcodes.SLD:  # Special register load
            self.cycles += 2
            if instr.type == 0:  # Stack pointer
                value = self.sp
            else:                # Flags
                value = (
                    4 * int(self.carry)
                    + 2 * int(self.zero)
                    + int(self.even)
                )
            if instr.a != 0:
                self.regs[instr.a] = value
            self.set_flags_from_value(value)

        elif instr.opcode == Opcodes.PST:  # Port store
            self.ports.port_store(
                (instr.immediate + self.poi) % 256,
                self.get_register(instr.a)
            )
            self.set_flags_from_value(self.get_register(instr.a))

        elif instr.opcode == Opcodes.PLD:  # Port load
            value = self.ports.port_load(
                (instr.immediate + self.poi) % 256
            )
            if instr.a != 0:
                self.regs[instr.a] = value
            self.set_flags_from_value(value)

        elif instr.opcode == Opcodes.PSH:  # Push to stack
            if instr.type == 0:  # Push
                self.sp = (self.sp + 255) % 256
                self.ram[
                    (self.sp + instr.immediate - self.poi + 256) % 256
                ] = self.get_register(instr.a)
                self.set_flags_from_value(self.get_register(instr.a))
            elif instr.type == 1:  # Decrement stack pointer
                self.cycles += 1
                self.sp = (self.sp - instr.immediate + 256) % 256
            else:  # Push without updating stack pointer
                self.ram[
                    (self.sp + instr.immediate - self.poi + 256) % 256
                ] = self.get_register(instr.a)
                self.set_flags_from_value(self.get_register(instr.a))

        elif instr.opcode == Opcodes.POP:  # Pop from stack
            value = self.ram[
                (self.sp + instr.immediate - self.poi + 256) % 256
            ]
            if instr.type == 0:  # Pop
                if instr.a != 0:
                    self.regs[instr.a] = value
                self.set_flags_from_value(value)
                self.sp = (self.sp + 1) % 256
            elif instr.type == 1:  # Increment stack pointer
                self.cycles += 1
                self.sp = (self.sp + instr.immediate) % 256
            else:  # Pop without updating stack pointer
                if instr.a != 0:
                    self.regs[instr.a] = value
                self.set_flags_from_value(value)

        elif instr.opcode == Opcodes.MST:  # Memory store
            self.ram[
                (instr.immediate + self.poi) % 256
            ] = self.get_register(instr.a)
            self.set_flags_from_value(self.get_register(instr.a))

        elif instr.opcode == Opcodes.MLD:  # Memory load
            value = self.ram[
                (instr.immediate + self.poi) % 256
            ]
            if instr.a != 0:
                self.regs[instr.a] = value
            self.set_flags_from_value(value)

        elif instr.opcode == Opcodes.LIM:  # Load immediate
            if instr.a != 0:
                self.regs[instr.a] = instr.immediate
            else:
                usenextimmediate = True
                self.nextimm = instr.immediate

        elif instr.opcode == Opcodes.MOV:  # Move
            if instr.a != 0:
                self.regs[instr.a] = self.get_register(instr.b)

        elif instr.opcode == Opcodes.AIM:  # AND Immediate
            result, flags = do_alu(
                self.get_register(instr.a), instr.immediate,
                Opcodes.AIM, 0
            )
            self.set_flags(flags)
            if instr.a != 0:
                self.regs[instr.a] = result

        elif instr.opcode in (Opcodes.CMP, Opcodes.CMA):  # Compare operations
            result, flags = do_alu(
                self.get_register(instr.a), instr.immediate,
                instr.opcode, 0
            )
            self.set_flags(flags)

        elif instr.opcode in (Opcodes.ADI, Opcodes.SFI):  # Add/shift immediate
            result, flags = do_alu(
                self.get_register(instr.b), instr.immediate,
                instr.opcode, instr.type
            )
            self.set_flags(flags)
            if instr.a != 0:
                self.regs[instr.a] = result

        else:  # All other ALU instructions
            result, flags = do_alu(
                self.get_register(instr.b), self.get_register(instr.c),
                instr.opcode, instr.type
            )
            self.set_flags(flags)
            if instr.a != 0:
                self.regs[instr.a] = result

        # Update program counter
        if jumptarget is not None:  # Jump across pages
            self.pc = jumptarget
        elif branchtarget is not None:  # Branch within page
            self.pc = (self.pc // 64 * 64) + branchtarget % 64
        elif branchtarget is None:
            if self.pc == self.loopsrc and self.loopcnt > 0:  # Loop
                self.loopcnt -= 1
                self.pc = self.loopdest
            else:  # Increment
                self.pc += 1
                if self.pc % 64 == 0:  # Page overflow
                    self.pc -= 64

        # Update pointer
        if not (updatepointer or self.ep):
            self.poi = 0

        # Update next immediate
        if not usenextimmediate:
            self.nextimm = 0

        # Update settings
        if not updatesettings:
            self.abc = False
            self.fnf = False

    def run_program(self, maxcycles: int = 1000000) -> int:
        """Run the currently loaded program, returning number of cycles"""

        self.reset_cpu(ignoreram=True)
        while self.cycles < maxcycles:
            try:
                self.cycle()
            except CPUError as error:
                raise CPUError(
                    f"Error on line {self.pc}: {error}"
                ) #from None
            except CPUHalt:
                break
            except Exception as error:
                raise CPUError(
                    f"Error on line {self.pc}: {error}"
                ) #from None
        if self.cycles >= maxcycles:
            raise CPUError(
                "Program running from too long"
            ) from None
        return self.cycles
