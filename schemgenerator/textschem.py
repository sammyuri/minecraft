from nbt import nbt

def generate_block_data(data, blankschem):
    def get_block(x, z):
        direction = (x + 1) % 2
        return 9 + direction if z % 2 == 1 else 7 + direction

    xlength = blankschem["Width"].value
    zlength = blankschem["Length"].value

    basedata = bytearray(blankschem["BlockData"].value)
    for sprite in range(256):
        x, z = sprite % 16, sprite // 16
        overallx = 2 * x + 1
        overallz = 10 * z
        spritedata = data[sprite * 64:(sprite + 1) * 64][::-1]
        absolute = overallx + overallz * xlength
        for i in range(8):
            for j in range(8):
                if spritedata[(7 - j) + 8 * (7 - i)] == "0": continue
                adjusted = absolute + xlength * j + xlength * zlength * (2 * i + 1)
                basedata[adjusted] = get_block(x, j)
    return basedata


def generate_schematic(data, name="textures"):
    blankschem = nbt.NBTFile("templates/base.schem", "rb")

    nbtfile = nbt.NBTFile()
    nbtfile.name = "Schematic"

    nbtfile.tags.extend([
        nbt.TAG_Int(name="PaletteMax", value=10),
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

    palette = nbt.TAG_Compound()
    palette.tags = [
        nbt.TAG_Int(name="minecraft:light_gray_terracotta", value=0),
        nbt.TAG_Int(name="minecraft:redstone_torch[lit=true]", value=1),
        nbt.TAG_Int(name="minecraft:air", value=2),
        nbt.TAG_Int(name="minecraft:redstone_wire[east=none,north=side,power=0,south=side,west=none]", value=3),
        nbt.TAG_Int(name="minecraft:redstone_wall_torch[facing=south,lit=false]", value=4),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=north,locked=false,powered=false]", value=5),
        nbt.TAG_Int(name="minecraft:redstone_wall_torch[facing=north,lit=true]", value=6),
        nbt.TAG_Int(name="minecraft:redstone_wall_torch[facing=east,lit=false]", value=7),
        nbt.TAG_Int(name="minecraft:redstone_wall_torch[facing=west,lit=false]", value=8),
        nbt.TAG_Int(name="minecraft:repeater[delay=2,facing=west,locked=false,powered=false]", value=9),
        nbt.TAG_Int(name="minecraft:repeater[delay=2,facing=east,locked=false,powered=false]", value=10),
    ]
    palette.name = "Palette"
    nbtfile.tags.append(palette)

    basedata = generate_block_data(data, blankschem)
    nbtfile.tags.append(nbt.TAG_Byte_Array(name="BlockData"))
    nbtfile["BlockData"].value = basedata
    nbtfile.tags.append(nbt.TAG_List(name="BlockEntities", type=nbt.TAG_Compound))

    nbtfile.write_file(f"{name}.schem")
