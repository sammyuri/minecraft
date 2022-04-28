from nbt import nbt
from os import path

from .blockdata import generate_block_data


def generate_schematic(
    machinecode: list[str], name: str, large: bool = True
) -> None:
    """Generate a schematic from the given machine code instructions"""

    pathto = __file__
    blankschem = nbt.NBTFile(
        path.dirname(__file__)
        + "/templates/ROM_blank_"
        + ("4" if large else "2")
        + "KiB.schem",
        "rb"
    )

    nbtfile = nbt.NBTFile()
    nbtfile.name = "Schematic"

    nbtfile.tags.append(nbt.TAG_Int(name="PaletteMax", value=4))

    palette = nbt.TAG_Compound(name="Palette")
    palette.tags.append(nbt.TAG_Int(name="minecraft:air", value=0))
    palette.tags.append(nbt.TAG_Int(name="minecraft:redstone_block", value=1))
    palette.tags.append(nbt.TAG_Int(name="minecraft:barrel", value=2))
    palette.tags.append(nbt.TAG_Int(name="minecraft:stone", value=3))
    palette.name = "Palette"
    nbtfile.tags.append(palette)

    nbtfile.tags.extend([
        nbt.TAG_Int(name="DataVersion", value=blankschem["DataVersion"].value),
        nbt.TAG_Int(name="Version", value=blankschem["Version"].value),
        nbt.TAG_Short(name="Length", value=blankschem["Length"].value),
        nbt.TAG_Short(name="Height", value=blankschem["Height"].value),
        nbt.TAG_Short(name="Width", value=blankschem["Width"].value),
        nbt.TAG_Int_Array(name="Offset"),
    ])
    nbtfile["Offset"].value = blankschem["Offset"].value

    metadata = nbt.TAG_Compound()
    metadata.tags = blankschem["Metadata"].tags.copy()
    metadata.name = "Metadata"
    nbtfile.tags.append(metadata)

    basedata, blockentities = generate_block_data(
        machinecode, blankschem, large
    )

    nbtfile.tags.append(nbt.TAG_Byte_Array(name="BlockData"))
    nbtfile["BlockData"].value = basedata
    nbtfile.tags.append(blockentities)

    nbtfile.write_file(f"{name}.schem")
