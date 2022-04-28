from lib2to3.pytree import convert
from nbt import nbt

SCHEM_MAX_SIZE = 2048


def convert_machinecode(machinecode: list[str]) -> list[str]:
    """Convert machine code from 2 bytes to one 16 bit string"""

    return [
        instr[0:8] + instr[9:17] for instr in machinecode
    ]


def create_barrel(pos: list[int], ss: int) -> nbt.TAG_Compound:
    """Generate a barrel with specified signal strength and position"""

    barrel = nbt.TAG_Compound(name="")

    barrel.tags.append(nbt.TAG_Int_Array(name="Pos"))
    barrel["Pos"].value = pos.copy()

    itemslist = nbt.TAG_List(name="Items", type=nbt.TAG_Compound)
    stacks = min(27, (max(64 * ss, int((27 * 64 / 14) * (ss - 1)) + 63)) // 64)

    for count in range(stacks):
        item = nbt.TAG_Compound(name="")
        item.tags.append(nbt.TAG_Byte(
            name="Slot",
            value=count
        ))
        item.tags.append(nbt.TAG_String(
            name="id",
            value="minecraft:redstone"
        ))
        item.tags.append(nbt.TAG_Byte(
            name="Count",
            value=64
        ))
        itemslist.tags.append(item)

    barrel.tags.append(itemslist)
    barrel.tags.append(nbt.TAG_String(name="Id", value="minecraft:barrel"))

    return barrel


def generate_block_data(
    machinecode: list[str], blankschem: nbt.NBTFile, large: bool = True
) -> tuple[bytearray, nbt.TAG_List]:
    """Generate block data for a schematic"""

    machinecode = convert_machinecode(machinecode)

    basedata = bytearray(blankschem["BlockData"].value)
    blockentities = nbt.TAG_List(name="BlockEntities", type=nbt.TAG_Compound)

    machinecode.extend(
        ["0000000000000000" for i in range(SCHEM_MAX_SIZE - len(machinecode))]
    )

    for zoffset in range(0, 2 if large else 1):
        for instruction in range(zoffset * 256, (zoffset + 1) * 256):
            ilist = [
                machinecode[64 * (instruction // 16) + instruction % 16],
                machinecode[64 * (instruction // 16) + instruction % 16 + 16],
                machinecode[64 * (instruction // 16) + instruction % 16 + 32],
                machinecode[64 * (instruction // 16) + instruction % 16 + 48],
            ]
            for bit in range(16):

                x = 4 * (instruction // 16)
                if bit > 7 and instruction % 32 < 16:
                    x += 2
                if bit < 8 and instruction % 32 > 15:
                    x += 2
                y = 15 - ((2 * bit) % 16 + (1 if instruction % 2 == 0 else 0))
                z = 30 + 32 * (int(large) - zoffset) - (2 * (instruction % 16))
                absolute = x + 63 * z + (63 if large else 31) * 63 * y

                ss = 15 - (
                    int(ilist[0][bit])
                    + int(ilist[1][bit]) * 2
                    + int(ilist[2][bit]) * 4
                    + int(ilist[3][bit]) * 8
                )

                if ss == 0:
                    basedata[absolute] = 3
                elif ss != 15:
                    blockentities.tags.append(
                        create_barrel([x, y, z], ss)
                    )
                    basedata[absolute] = 2

    return basedata, blockentities
