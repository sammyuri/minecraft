from nbt import nbt
import json

def generate_block_data(blankschem):
    def get_block(z, state, type):
        values = {
            (0, 0, 0): 5,
            (0, 0, 1): 4,
            (0, 0, 2): 3,
            (0, 1, 0): 10,
            (0, 1, 1): 11,
            (0, 1, 2): 9,
            (1, 0, 0): 7,
            (1, 0, 1): 8,
            (1, 0, 2): 3,
            (1, 1, 0): 12,
            (1, 1, 1): 13,
            (1, 1, 2): 9,
        }
        return values[(0 if z % 16 == 3 else 1, state, type)]

    xlength = blankschem["Width"].value
    zlength = blankschem["Length"].value
    basedata = bytearray(blankschem["BlockData"].value)
    blocks = blankschem["BlockEntities"]
    newblocks = nbt.TAG_List(name="BlockEntities", type=nbt.TAG_Compound)
    for tag in blocks:
        if tag["Pos"][1] % 16 in (3, 5) or tag["Id"] == "minecraft:barrel":
            newblocks.append(tag)

    with open("world.json", "r") as f:
        worlddata = json.loads(f.read().rstrip())

    for worldx in range(8):
        for worldy in range(8):
            for worldz in range(8):
                realx = 2 * (worldx + 8 * (worldz % 4)) + 1
                realz = 16 * ((7 - worldy) // 2) + 2 * ((7 - worldy) % 2) + 3
                realy = 18 * (1 - (worldz // 4)) + ((realx + 1) % 4) // 2 + 1
                adjustz = 1 if worldy % 2 == 0 else -1

                block = worlddata[worldy][worldz][worldx] if worldz == 4 and worldx == 1 and worldy == 4 else 0

                for bit in range(4):
                    state = block % 2
                    adjusted = (
                        realx
                        + xlength * realz
                        + xlength * zlength * (realy + 2 * bit)
                    )
                    basedata[adjusted] = get_block(realz, state, 0)
                    basedata[adjusted + adjustz * xlength] = get_block(realz, state, 1)
                    basedata[adjusted + adjustz * xlength * 2] = get_block(realz, state, 1)
                    basedata[adjusted + adjustz * xlength * 3] = get_block(realz, state, 2)
                    newtag = nbt.TAG_Compound()
                    newtag.tags = [
                        nbt.TAG_String(name="Id", value="minecraft:comparator"),
                        nbt.TAG_Int(name="OutputSignal", value=2-2*state),
                        nbt.TAG_Int_Array(name="Pos")
                    ]
                    newtag["Pos"].value = [
                        realx,
                        realy + 2 * bit,
                        realz + 3 * adjustz
                    ]
                    newblocks.append(newtag)
                    block //= 2
    return basedata, newblocks
                    


    def get_block(x, z):
        direction = (x + 1) % 2
        return 9 + direction if z % 2 == 1 else 7 + direction

    for sprite in range(256):
        x, z = sprite % 16, sprite // 16
        overallx = 2 * x + 1
        overallz = 10 * z
        spritedata = data[sprite * 64:(sprite + 1) * 64][::-1]
        absolute = overallx + overallz * xlength
        for i in range(8):
            for j in range(8):
                if spritedata[(7 - j) + 8 * i] == "0": continue
                adjusted = absolute + xlength * j + xlength * zlength * (2 * i + 1)
                basedata[adjusted] = get_block(x, j)


def generate_schematic(name="world"):
    blankschem = nbt.NBTFile("templates/world_base.schem", "rb")

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
        nbt.TAG_Int(name="minecraft:air", value=0),
        nbt.TAG_Int(name="minecraft:green_terracotta", value=1),
        nbt.TAG_Int(name="minecraft:barrel[facing=up,open=false]", value=2),
        nbt.TAG_Int(name="minecraft:comparator[facing=west,mode=subtract,powered=true]", value=3),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=south,locked=false,powered=false]", value=4),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=south,locked=true,powered=false]", value=5),
        nbt.TAG_Int(name="minecraft:comparator[facing=east,mode=subtract,powered=true]", value=6),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=north,locked=true,powered=false]", value=7),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=north,locked=false,powered=false]", value=8),
        nbt.TAG_Int(name="minecraft:comparator[facing=west,mode=subtract,powered=false]", value=9),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=south,locked=true,powered=true]", value=10),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=south,locked=false,powered=true]", value=11),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=north,locked=true,powered=true]", value=12),
        nbt.TAG_Int(name="minecraft:repeater[delay=1,facing=north,locked=false,powered=true]", value=13),
    ]
    palette.name = "Palette"
    nbtfile.tags.append(palette)

    basedata, blocks = generate_block_data(blankschem)
    nbtfile.tags.append(nbt.TAG_Byte_Array(name="BlockData"))
    nbtfile["BlockData"].value = basedata
    nbtfile.tags.append(nbt.TAG_List(name="BlockEntities", type=nbt.TAG_Compound))
    nbtfile["BlockEntities"] = blocks

    nbtfile.write_file(f"{name}.schem")


generate_schematic()