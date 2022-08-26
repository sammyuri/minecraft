
//constants
    //size constants
        @DEFINE BLOCKSIZE 16
        @DEFINE PLAYERWIDTH 9 //technically it's 10, but 9 makes calculations easier
        @DEFINE PLAYERHEIGHT 28 //technically it's 29, but 28 makes calculations easier
        @DEFINE PLAYERHALFWIDTH 5
        @DEFINE PLAYERCAMHEIGHT 24
        @DEFINE PICKUPDOWN 12
        @DEFINE PICKUPUP 37
        @DEFINE PICKUPSIDENEG 22
        @DEFINE PICKUPSIDEPOS 28
        @DEFINE PLAYERCROUCHCAMHEIGHT 22
        @DEFINE MIDDLEOFVOID 0b1010_0000
        @DEFINE BLOCKMIDDLEOFVOID 0b1100
    //gameplay constants
        @DEFINE GRAVITY 15 //the downwards change in velocity per frame
        @DEFINE JUMPSTRENGTH 17 //the initial vertical velocity of a jump
        @DEFINE SPEEDFACTOR 0b01_000000 //scales the speed of the characters movement. A value of 1 results in a speed of 4 while crouching, 8 while walking, and 12 while sprinting. In 0bSX.XXXXXX format
        @DEFINE RAYCASTMAXLENGTH 0x40 //4 blocks
        //@DEFINE REQUIREDBREAKSTRENGTH 8
        @DEFINE BREAKTIME 24 //scales how much time it takes to break a block
        @DEFINE MAXHEALTH 8 //NOTE: doesn't affect health rendering
        @DEFINE APPLEHEALTH 2
        @DEFINE MINFALLDAMAGESPEED 32
        @DEFINE FALLDAMAGESCALING 0b00_001000
        @DEFINE RANDOMTICKSPEED 10 //TEMP: 10 is too high. At this speed each block has 1/51 chance of being ticked every frame
        @DEFINE SMELTTIME 0xC0  // this was set to something ridiculous?
        @DEFINE LEAVES_SAPLING_PROBABILITY 50  // 50/256
        @DEFINE LEAVES_STICK_PROBABILITY 70  // 20/256
        @DEFINE LEAVES_APPLE_PROBABILITY 80  // 10/256
    //other constants
        @DEFINE BOTTOMOFSTACK 255 //in URCX: minreg + minheap. in CHUNGUS: 0
    //block IDs
        @DEFINE BLOCK_AIR 0x0
        @DEFINE BLOCK_GRASS 0x1
        @DEFINE BLOCK_DIRT 0x2
        @DEFINE BLOCK_STONE 0x3
        @DEFINE BLOCK_COBBLE 0x4
        @DEFINE BLOCK_LOG 0x5
        @DEFINE BLOCK_LEAVES 0x6
        @DEFINE BLOCK_PLANK 0x7
        @DEFINE BLOCK_COALORE 0x8
        @DEFINE BLOCK_IRONORE 0x9
        @DEFINE BLOCK_SAND 0xA
        @DEFINE BLOCK_GLASS 0xB
        @DEFINE BLOCK_SAPLING 0xC
        @DEFINE BLOCK_TABLE 0xD
        @DEFINE BLOCK_FURNACE 0xE
        @DEFINE BLOCK_CHEST 0xF
    //item IDs
        @DEFINE ITEM_AIR 0x00
        @DEFINE ITEM_STICK 0x10
        @DEFINE ITEM_DIRT 0x20
        @DEFINE ITEM_STONE 0x30
        @DEFINE ITEM_COBBLE 0x40
        @DEFINE ITEM_LOG 0x50
        @DEFINE ITEM_LEAVES 0x60
        @DEFINE ITEM_PLANK 0x70
        @DEFINE ITEM_COAL 0x80
        @DEFINE ITEM_IRONORE 0x90
        @DEFINE ITEM_SAND 0xA0
        @DEFINE ITEM_GLASS 0xB0
        @DEFINE ITEM_SAPLING 0xC0
        @DEFINE ITEM_IRONINGOT 0xD0
        @DEFINE ITEM_APPLE 0xE0
        @DEFINE ITEM_NONSTACKABLE 0xF0
    //nonstackable IDs
        @DEFINE ITEM_WOODPICKAXE 0xF0
        @DEFINE ITEM_WOODAXE 0xF1
        @DEFINE ITEM_WOODSHOVEL 0xF2
        @DEFINE ITEM_WOODSWORD 0xF3
        @DEFINE ITEM_STONEPICKAXE 0xF4
        @DEFINE ITEM_STONEAXE 0xF5
        @DEFINE ITEM_STONESHOVEL 0xF6
        @DEFINE ITEM_STONESWORD 0xF7
        @DEFINE ITEM_IRONPICKAXE 0xF8
        @DEFINE ITEM_IRONAXE 0xF9
        @DEFINE ITEM_IRONSHOVEL 0xFA
        @DEFINE ITEM_IRONSWORD 0xFB
        @DEFINE ITEM_SHEARS 0xFC
        @DEFINE ITEM_TABLE 0xFD
        @DEFINE ITEM_FURNACE 0xFE
        @DEFINE ITEM_CHEST 0xFF
    //entity IDs
        //NOTE: item entities have the following structure in RAM:
            //byte 1: IIII_VVVV; I=id, V=y-velocity
            //byte 2: XXX.X_ZZZ.Z
            //byte 3: 0YYY.YYYY
        @DEFINE ENTITY_STICK 0x1
        @DEFINE ENTITY_DIRT 0x2
        @DEFINE ENTITY_APPLE 0x3
        @DEFINE ENTITY_COBBLE 0x4
        @DEFINE ENTITY_LOG 0x5
        @DEFINE ENTITY_LEAVES 0x6
        @DEFINE ENTITY_PLANK 0x7
        @DEFINE ENTITY_COAL 0x8
        @DEFINE ENTITY_IRONORE 0x9
        @DEFINE ENTITY_SAND 0xA
        @DEFINE ENTITY_FALLINGSAND 0xB
        @DEFINE ENTITY_SAPLING 0xC
        @DEFINE ENTITY_TABLE 0xD
        @DEFINE ENTITY_FURNACE 0xE
        @DEFINE ENTITY_CHEST 0xF
    //textures
        @DEFINE TEXTURE_NUMBER 0x20
        @DEFINE TEXTURE_STACKABLE 0x40
        @DEFINE TEXTURE_NONSTACKABLE 0x50
        @DEFINE TEXTURE_GUI_EMPTY 0x61
        @DEFINE TEXTURE_GUI_ARROW 0x63
        @DEFINE TEXTURE_GUI_SMELTING 0x65
        @DEFINE TEXTURE_INVENTORY 0x70
        @DEFINE TEXTURE_CRAFT 0x75
        @DEFINE TEXTURE_FURNACE 0x78
        @DEFINE TEXTURE_CHEST 0x7C
        @DEFINE TEXTURE_HIGHLIGHT0 128
        @DEFINE TEXTURE_HIGHLIGHT7 135
        @DEFINE TEXTURE_HEARTEMPTY 136
        @DEFINE TEXTURE_HEARTFULL 137
        @DEFINE TEXTURE_GAMEOVER 0x90
        @DEFINE TEXTURE_FURNACEFRONTOFF 19
        @DEFINE TEXTURE_FURNACEFRONTON 20
        @DEFINE TEXTURE_CHESTFRONT 23
    //other
        @DEFINE TOOL_PICKAXE 0
        @DEFINE TOOL_AXE 1
        @DEFINE TOOL_SHOVEL 2
        @DEFINE TOOL_SWORD 3

        @DEFINE STRENGTHFORITEM 3
        @DEFINE STRENGTH_FIST 4
        @DEFINE STRENGTH_WOOD 5
        @DEFINE STRENGTH_STONE 6
        @DEFINE STRENGTH_IRON 7

        @DEFINE BLOCKTYPE_STONE 0
        @DEFINE BLOCKTYPE_WOOD 1
        @DEFINE BLOCKTYPE_SOFT 2
        @DEFINE BLOCKTYPE_LEAVES 3
        @DEFINE BLOCKTYPE_GLASS 4
        @DEFINE BLOCKTYPE_SAPLING 5

//memory locations
    //OPTIM: it might be worth placing some of these at the base of the stack instead of the heap to reduce cache misses
    @DEFINE x m0 //7 bits //NOTE: replace with '0' if 'm0' not supported in translator
    @DEFINE y m1 //8 bits
    @DEFINE z m2 //7 bits
    @DEFINE rot m3 //8 bits
    @DEFINE onGround m4 //1 bit
    @DEFINE velY m5 //6 bits
    @DEFINE needReRender m6 //1 bit
    @DEFINE crouching m7 //1 bit
    @DEFINE prevX m8 //7 bits
    @DEFINE prevY m9 //8 bits
    @DEFINE prevZ m10 //7 bits
    //@DEFINE prevTargetXZ m11 //8 bits XXXX_ZZZZ //NOTE: this address no longer in use
    //@DEFINE prevTargetY m12 //4 bits //NOTE: this address no longer in use
    @DEFINE inventory m11 //NOTE: takes up 15 cells (m13-m27), 8 bits each
    @DEFINE inventorySlot m26 //8 bits
    //@DEFINE breakPhase m29 //8 bits 0PPP_0CCC P=previous C=current //NOTE: this address no longer in use 
    //@DEFINE targetXZ m30 //8 bits XXXX_ZZZZ //NOTE: this address no longer in use
    //@DEFINE targetY m31 //4 bits //NOTE: this address no longer in use
    @DEFINE craftingGrid m27 //NOTE: takes up 9 cells (m32-m40), 8 bits each //NOTE: these cells can be used again in portions of the code that don't interfere with crafting.
    @DEFINE craftingOutput m36 //8 bits //NOTE: this cell can be used again in portions of the code that don't interfere with crafting
    @DEFINE permanentSelectedSlot m37 //8 bits
    @DEFINE health m41
    @DEFINE loadedTileEntity m42
    @DEFINE newestItemEntity m43
    @DEFINE logsInWorld m44
    @DEFINE itemEntities m45
    @DEFINE blockEntities m117
    @DEFINE endBlockEntities m224
