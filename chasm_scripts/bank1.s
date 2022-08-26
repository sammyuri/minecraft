.PAGE:
.setup
    lim r0, 0x10
    mst r0, x
    lim r0, 0x20
    mst r0, y
    lim r0, 0x60
    mst r0, z
    lim r0, 0x08
    mst r0, rot
    lim r0, 0xFF
    mst r0, onGround
    lim r0, 0xFF
    mst r0, needReRender
    mst r0, velY
    mst r0, crouching
    mst r0, prevX
    mst r0, prevY
    mst r0, prevZ
    lim r0, 0xFF
    mst r0, permanentSelectedSlot
    lim r0, MAXHEALTH
    mst r0, health
    lim r0, loadedTileEntity
    mst r0, newestItemEntity
    lim r0, 4
    mst r0, logsInWorld

    lim r0, 0x14
    mst r0, 11
    lim r0, 0x55
    mst r0, 12
    lim r0, 0x89
    mst r0, 13
    lim r0, 0xFE
    mst r0, 14
    lim r0, 0xFF
    mst r0, 15

jmp .mainLoop

.gameOver
    pld r0, %switchbanks
    jmp .bank2_drawGameOverScreen

.bank1_dropItemFromLeaves
    cal .dropItemFromLeaves
    pld r0, %switchbanks
ret

.addItemToInventoryFromBank2
    cal .addItemToInventory
    pld r0, %switchbanks
jmp .bank2_addItemToInventoryReturn

.furnaceLoopFromBank2
    cal .updateAllFurnaces
    pld r0, %switchbanks
jmp .bank2_updateAllFurnacesReturn






.PAGE:
.mainLoop
    pst r0, %playerinput
    nop
    // is open/close inventory pressed?
        pld r1, %playerinput
        brt zero, ~+5
        pld r0, %switchbanks
        jmp .goFromOpenInventory

    .continueFromClosingInventory
        lim r0, 255
        mst r0, needReRender

    // inventory movement
        pld r1, %playerinput
        mld r2, inventorySlot
        addv r2, r2, r1
        cmp r2, 5  // left rollover
        brt nzero, ~+2
            lim r2, 0
        cmp r2, 15  // right rollover
        brt nzero, ~+2
            lim r2, 4
        aim r2, 0x0F // keep witin hotbar
        mst r2, inventorySlot

    jmp .handleBreakAndPlace

.endBreakBlock
    pld r7, %playerinput
    brt nzero, ~+2
    jmp .endBreakAndPlace
        mld r7, crouching
        cmp r5, BLOCK_TABLE
        brt less, .endUseTargetedBlock
            brt nzero, ~+3
                pld r0, %switchbanks
                jmp .goFromOpenCrafting
            jmp .useTargetedBlock
        .endUseTargetedBlock
        mld r6, inventorySlot
        poi r6
        mld r6, inventory
        // check if placeable
            cmp r6, ITEM_TABLE
            brt grtreq, ~+9
            cmp r6, ITEM_IRONINGOT
            brt grtreq, .useNonPlaceablePage1
            cmp r6, 0
            brt zero, .useNonPlaceablePage1
            cmp r6, ITEM_COAL
            brt zero, .useNonPlaceablePage1
        // get id of block
            bsri r6, r6, 4
            jmp ~+2
                aim r6, 0x0F
            bsri r7, r1, 4
            pst r7, %blockram_x
            pst r2, %blockram_y
            lim r0, 0x0F
            and r7, r1, r0
            pst r7, %blockram_z
            jmp .finishPlaceBlock
.useNonPlaceablePage1
    jmp .useNonPlaceable







.PAGE:
.handleBreakAndPlace
    // handle break/place
        cal .rayCast
            //r1: x, z pos of space before first found block
            //r2: y pos of space before first found block
            //r3: x, z pos of first found block
            //r4: y pos of first found block
            //r5: id of first found block (returns air if nothing found, bedrock will return -1)
            //r6: length of raycast (returns -1 if nothing found)
        pld r7, %playerinput
        cmp r5, 0
        brt nzero, ~+2
            jmp .noRayCastHit
        cmp r7, 0
        brt zero, .endBreakBlockPage1
            cma r5, 128
            brt nzero, .endBreakBlockPage1
            cmp r5, BLOCK_SAPLING
            brt zero, .endBlockBreakAnimPage1
            cmp r5, BLOCK_LOG
            brt nzero, ~+4
                mld r7, logsInWorld
                adi r7, r7, -1
                mst r7, logsInWorld
            // add block breaking animation
                cal .getRayCastTargetQuad
                // check what item is in hand to get appropriate strength
                    mld r6, inventorySlot
                    poi r6
                    mld r6, inventory
                    cmp r6, ITEM_NONSTACKABLE
                    brt less, .breakWithoutTool
                    cmp r6, ITEM_SHEARS
                    brt greater, .breakWithoutTool
                    brt zero, .breakWithShears
                    lim r0, 0x03
                    and r7, r6, r0
                    bsri r6, r6, 2
                    aim r6, 0b11
                    adi r6, r6, STRENGTH_WOOD
                    cmp r7, 0
                    brt zero, .breakWithPickaxe
                    cmp r7, TOOL_AXE
                    brt zero, .breakWithAxe
                    cmp r7, TOOL_SHOVEL
                    brt zero, .breakWithShovel
                    jmp .breakWithoutTool
                    .breakWithShears
                        cmp r5, BLOCK_LEAVES
                        brt nzero, .breakWithoutTool
                        lim r6, STRENGTH_IRON
                        jmp .endGetBreakStrength
                    .breakWithPickaxe
                        cal .getBlockType
                        cmp r7, BLOCKTYPE_STONE
                        brt nzero, .breakWithoutTool
                        jmp .endGetBreakStrength
                    .breakWithAxe
                        cal .getBlockType
                        cmp r7, BLOCKTYPE_WOOD
                        brt nzero, .breakWithoutTool
                        jmp .endGetBreakStrength
                    .breakWithShovel
                        cal .getBlockType
                        cmp r7, BLOCKTYPE_SOFT
                        brt nzero, .breakWithoutTool
                        jmp .endGetBreakStrength
                    .breakWithoutTool
                        lim r6, STRENGTH_FIST
                    .endGetBreakStrength
                        cal .getBlockHardness
                        sub r7, r6, r7
                lim r6, TEXTURE_HIGHLIGHT0
                jmp .blockBreakAnimLoop

    .endBreakBlockPage1
        jmp .endBreakBlock
    .endBlockBreakAnimPage1
        jmp .endBlockBreakAnimPage1






.PAGE:
.blockBreakAnimLoop
    adi r6, r6, 1
    cal .buildQuadFromStack
    lim r0, 0b1101
    pst r0, %amogus_settings
    pst r6, %amogus_tex
    pld r0, %amogus_drawquad
    lim r2, 0
    .blockBreakAnimDelayLoop
        add r2, r2, r7
        lim r1, 255
        .blockBreakAnimDelaySubLoop
            adi r1, r1, -1
            brn true, ~+1
            brn nzero, .blockBreakAnimDelaySubLoop
        cmp r2, BREAKTIME
        brt lesseq, .blockBreakAnimDelayLoop
    pld r0, %amogus_drawtoscreen
    psh r2
    psh r3
    psh r4
    psh r5
    psh r6
    psh r7
        cal .drawHotbar
    pop r7
    pop r6
    pop r5
    pop r4
    pop r3
    pop r2
    pld r0, %screen_buffer
    cmp r6, TEXTURE_HIGHLIGHT7
    brt less, .blockBreakAnimLoop
.endBlockBreakAnim
    cmp r7, STRENGTHFORITEM
    brt less, .endDropItemPage1
    cmp r5, BLOCK_GLASS
    brt zero, .endDropItemPage1
    cmp r5, BLOCK_GRASS
    brt nzero, ~+4
        lim r5, ENTITY_DIRT
        cal .createEntity
        jmp .endDropItemPage1
    cmp r5, BLOCK_STONE
    brt nzero, ~+4
        lim r5, ENTITY_COBBLE
        cal .createEntity
        jmp .endDropItemPage1
    cmp r5, BLOCK_LEAVES
    brt nzero, ~+2
        jmp .breakLeavesDropItem
    // default
        cal .createEntity
        jmp .endDropItemPage1
.endDropItemPage1
    jmp .endDropItem






.PAGE:
.breakLeavesDropItem
    cmp r7, STRENGTH_IRON
    brt nzero, ~+3
        cal .createEntity
        jmp .endDropItem
    cal .dropItemFromLeaves
.endDropItem
    psh r1
    psh r2
    mov r7, r4
    mov r6, r3
        cal .findBlockEntity
        cmp r1, 0
        brt zero, ~+3
            poi r1
            mst r0, 0
    mov r4, r7
    mov r3, r6
    pop r2
    pop r1

    bsri r7, r3, 4
    pst r7, %blockram_x
    mov r7, r3
    aim r7, 0x0F
    pst r7, %blockram_z
    pst r4, %blockram_y
    pst r0, %blockram_id
    
    .fallingSandLoop
        adi r4, r4, 1
        pst r4, %blockram_y
        pld r5, %blockram_id
        cmp r5, BLOCK_SAND
        brt nzero, ~+5
            lim r5, ENTITY_FALLINGSAND
            cal .createEntity
            pst r0, %blockram_id
            jmp .fallingSandLoop
        cmp r5, BLOCK_SAPLING
        brt nzero, ~+3
            cal .createEntity
            jmp .fallingSandLoop

    lim r0, 255
    mst r0, needReRender
    pld r0, %playerinput
    jmp .endBreakAndPlace

.dropItemFromLeaves
    pld r1, %rng
    cmp r1, LEAVES_SAPLING_PROBABILITY
    brt grtreq, ~+4
        lim r5, ENTITY_SAPLING
        cal .createEntity
        ret
    cmp r1, LEAVES_STICK_PROBABILITY
    brt grtreq, ~+4
        lim r5, ENTITY_STICK
        cal .createEntity
        ret
    cmp r1, LEAVES_APPLE_PROBABILITY
    brt grtreq, ~+3
        lim r5, ENTITY_APPLE
        cal .createEntity
    ret





.PAGE:
.finishPlaceBlock
    cmp r6, BLOCK_SAPLING
    brt nzero, .endCheckIfCanPlaceSapling
        adi r3, r2, -1
        pst r3, %blockram_y
        pld r3, %blockram_id
        cmp r3, BLOCK_DIRT
        brt lesseq, ~+2
            jmp .endBreakAndPlace
        cmp r3, BLOCK_GRASS
        brt grtreq, ~+2
            jmp .endBreakAndPlace
        pst r2, %blockram_y
        jmp .placeBlock
    .endCheckIfCanPlaceSapling
        mld r3, x
        lim r0, 0xF0
        and r4, r1, r0
        lim r0, 0x10
        add r5, r4, r0
        sub r0, r3, r5
        brt grtreq, .endCheckIfIntersectPlayer
        adi r3, r3, PLAYERWIDTH
        sub r0, r3, r4
        brt lesseq, .endCheckIfIntersectPlayer

        mld r3, y
        bsli r4, r2, 4
        lim r0, 0x10
        add r5, r4, r0
        sub r0, r3, r5
        brt grtreq, .endCheckIfIntersectPlayer
        adi r3, r3, PLAYERWIDTH
        sub r0, r3, r4
        brt lesseq, .endCheckIfIntersectPlayer

        mld r3, z
        bsli r4, r1, 4
        lim r0, 0x10
        add r5, r4, r0
        sub r0, r3, r5
        brt grtreq, .endCheckIfIntersectPlayer
        adi r3, r3, PLAYERWIDTH
        sub r0, r3, r4
        brt lesseq, .endCheckIfIntersectPlayer
        jmp .endBreakAndPlace
    
    .endCheckIfIntersectPlayer
        psh r1
        psh r2
        cmp r6, BLOCK_CHEST
        brt nzero, ~+2
            jmp .createChestEntity

        cmp r6, BLOCK_FURNACE
        brt nzero, ~+2
            jmp .createFurnaceEntity
        
        pop r0
        pop r0
        jmp .continuePlaceBlock






.PAGE:
.continuePlaceBlock
    cmp r6, BLOCK_SAND
    brt nzero, .placeBlock
        adi r3, r2, -1
        pst r3, %blockram_y
        pld r3, %blockram_id
        pst r2, %blockram_y
        brt nzero, .placeBlock
        mov r3, r1
        mov r4, r2
        lim r5, ENTITY_FALLINGSAND
        cal .createEntity
        jmp .removeItemFromInventory
    .placeBlock
        pst r6, %blockram_id
        cmp r6, BLOCK_LOG
        brt nzero, ~+4
            mld r1, logsInWorld
            adi r1, r1, 1
            mst r1, logsInWorld
        .removeItemFromInventory
            mld r1, inventorySlot
            poi r1
            mld r2, inventory
            cmp r2, 0xF0
            brt less, ~+6
                .successfulPlace
                poi r1
                mst r0, inventory
                lim r0, 255
                mst r0, needReRender
                jmp .endBreakAndPlace
            adi r2, r2, -1
            lim r0, 0x0F
            and r3, r2, r0
            brt zero, .successfulPlace
            poi r1
            mst r2, inventory
        lim r0, 255
        mst r0, needReRender
    jmp .endBreakAndPlace
.noRayCastHit
    pld r7, %playerinput
    brt zero, .endBreakAndPlace
.useNonPlaceable
    mld r1, inventorySlot
    poi r1
    mld r2, inventory
    lim r0, 0xF0
    and r3, r2, r0
    cmp r3, ITEM_APPLE
    brt nzero, ~+13
        mld r3, health
        adi r3, r3, APPLEHEALTH
        cmp r3, MAXHEALTH
        brt lesseq, ~+2
            lim r3, MAXHEALTH
        mst r3, health
        adi r2, r2, -1
        cmp r2, ITEM_APPLE
        brt greater, ~+2
            lim r2, 0
        poi r1
        mst r2, inventory
.endBreakAndPlace
    jmp .miscInputs
        
        




.PAGE:
.miscInputs
    // handle crouching inputs
        pld r1, %playerinput
        mld r2, crouching
        sub r0, r2, r1
        brt zero, ~+4
            mst r1, crouching
            lim r0, 255
            mst r0, needReRender
        
    // handle rotation inputs
        pld r1, %playerinput
        brt zero, ~+21
            mld r2, rot
            lim r0, 0x0F
            and r3, r1, r0
            addv r2, r3, r2

            sub r3, r1, r3
            lim r0, 0xF0
            and r4, r2, r0
            cmp r3, 0x10
            brt nzero, ~+4
                cmp r4, 0x40
                brt zero, ~+2
                    addv r2, r3, r2
            cmp r3, 0xF0
            brt nzero, ~+4
                cmp r4, 0xC0
                brt zero, ~+2
                    addv r2, r3, r2
            mst r2, rot
            lim r0, 255
            mst r0, needReRender
    
    // handle movement inputs
        pld r1, %playerinput  // forward
        lim r0, SPEEDFACTOR
        smul446 r1, r1, r0

        pld r2, %amogus_sinyaw
        sub r3, r0, r2
        smul446 r4, r1, r3

        pld r3, %amogus_cosyaw
        smul446 r5, r1, r3


        pld r1, %playerinput  // strafe
        lim r0, SPEEDFACTOR
        smul446 r1, r1, r0

        smul446 r6, r1, r2
        add r5, r5, r6
        smul446 r6, r1, r3
        add r4, r4, r6

    // handle jumping inputs
        mld r1, onGround
        mst r0, onGround
        cmp r1, 0
        brt zero, .jumpInputNoJump
        pld r1, %playerinput
        brt zero, .jumpInputNoJump
        // jump
            lim r1, JUMPSTRENGTH
            mst r1, velY
            jmp .jumpInputEnd
        .jumpInputNoJump
            mld r1, velY
            lim r0, GRAVITY
            sub r1, r1, r0
            mst r1, velY
        .jumpInputEnd
    // move and collide
    pld r0, %blockram_oobactive
    psh r1
    psh r5
    psh r4
    jmp .moveAndCollide






.PAGE:
.moveAndCollide
    // prepare stack
        lim r0, %blockram_z
        psh r0
        lim r0, %blockram_x
        psh r0
        lim r0, %blockram_y
        psh r0
        lim r0, %blockram_z
        psh r0
        lim r0, %blockram_x
        psh r0
        lim r1, PLAYERWIDTH
        psh r1
        psh r1
        lim r0, PLAYERHEIGHT
        psh r0
        psh r1
        psh r1
        lim r0, z
        psh r0
        lim r0, x
        psh r0
        lim r0, y
        psh r0
        lim r0, z
        psh r0
        lim r0, x
        psh r0
    jmp .collisionLoop

    .collideResolvePositive
        psh r1
            bsli r7, r1, 4
            lim r0, BLOCKSIZE
            add r7, r7, r0
            popu r1, 3
            poi r1
            mst r7, 0
            mov r7, r1
        pop r1
        cmp r7, y
        brt nzero, ~+4
        // do fall damage
            mld r3, velY
            sub r3, r0, r3
            lim r0, MINFALLDAMAGESPEED
            sub r3, r3, r0
            cma r3, 128
            brt nzero, .endFallDamage
                lim r0, FALLDAMAGESCALING
                smul446 r3, r3, r0
                psh r2
                    mld r2, health
                    sub r2, r2, r3
                    brt nzero, .dieFromFallDamageCollision
                    cma r2, 128
                    brt zero, .dieFromFallDamageCollision
                    mst r2, health
                pop r2
            .endFallDamage
            lim r0, 255
            mst r0, onGround
            mst r0, velY
            jmp .collideResolveEnd
        .dieFromFallDamageCollision
            jmp .gameOver






.PAGE:
.collisionLoop
    popu r3, 0
    poi r3
    mld r2, 0
    popu r4, 15
    add r1, r2, r4
    poi r3
    mst r1, 0
    cma r4, 128
    brt nzero, ~+4
        popu r5, 5
        add r1, r1, r5
        add r2, r2, r5
    bsri r2, r2, 4
    bsri r1, r1, 4
    sub r0, r2, r1
    brt nzero, ~+3
        pop r0
        jmp .collideNoMovement
    cmp r3, y
    brt nzero, ~+7
        cmp r1, BLOCKMIDDLEOFVOID
        brt lesseq, ~+2
            lim r1, 0
        cmp r2, BLOCKMIDDLEOFVOID
        brt lesseq, ~+2
            lim r2, 0
    popu r3, 1
    poi r3
    mld r3, 0
    popu r4, 6
    add r4, r3, r4
    bsri r3, r3, 4
    bsri r4, r4, 4
    popu r5, 2
    poi r5
    mld r5, 0
    popu r6, 7
    add r6, r5, r6
    bsri r5, r5, 4
    bsri r6, r6, 4
    psh r5
    psh r3
    jmp .collideMainAxisLoop

.createFurnaceEntity
    lim r1, blockEntities
    .findSpaceForFurnaceLoop
        poi r1
        mld r2, 0
        brt zero, .foundSpaceForFurnace
        aim r2, 0b11000000
        cmp r2, 0b01000000
        brt nzero, ~+2
            adi r1, r1, 6
        adi r1, r1, 6
        cmp r1, endBlockEntities
        brt less, .findSpaceForFurnaceLoop
    jmp .endBreakAndPlace

    .foundSpaceForFurnace
        lim r2, 0b10000000
        cal .getBlockEntityDirection
        
        loopsrc .endClearFurnaceLoop
        loopcnt 3
            adi r1, r1, 1
            poi r1
            .endClearFurnaceLoop
            mst r0, 0
        jmp .placeBlock

        




.PAGE:
.collideMainAxisLoop
    popu r7, 12
    poi r7
    pst r1, 0
    popu r3, 0
    .collideSecondaryAxisLoop
        popu r7, 13
        poi r7
        pst r3, 0
        popu r5, 1
        .collideTertiaryAxisLoop
            popu r7, 14
            poi r7
            pst r5, 0
            pld r7, %blockram_id
            brt zero, .collideNoCollision
            cmp r7, BLOCK_SAPLING
            brt zero, .collideNoCollision
            // collision detected
                popu r7, 17
                cma r7, 128
                brt zero, .collideResolveNegative
                jmp .collideResolvePositive
                .collideResolveNegative
                    psh r1
                        bsli r1, r1, 4
                        popu r7, 8
                        adi r7, r7, 1
                        sub r7, r1, r7
                        popu r1, 3
                        poi r1
                        mst r7, 0
                        mov r7, r1
                    pop r1
                    cmp r7, y
                    brt nzero, ~+2
                        mst r0, velY
                        jmp .collideResolveEnd
                .collideNoCollision
                    adi r5, r5, 1
                sub r0, r5, r6
                brt lesseq, .collideTertiaryAxisLoop
                adi r3, r3, 1
            sub r0, r3, r4
            brt lesseq, .collideSecondaryAxisLoop
            .collideResolveEnd
            adi r1, r1, 1
        sub r0, r1, r2
        brt less, .collideMainAxisLoop
        isp r0, 3
        .collideNoMovement
        popu r7, 0
    cmp r7, x
    brt zero, ~+2
        jmp .collisionLoop
jmp .collisionLoopEnd






.PAGE:
.dieFromFallDamageBedrock
    jmp .gameOver
.collisionLoopEnd
    ssp 255
    mld r1, y
    cmp r1, MIDDLEOFVOID
    brt lesseq, .endCollideWithBedrock
        mst r0, y
        // do fall damage
            mld r1, velY
            sub r1, r0, r1
            lim r0, MINFALLDAMAGESPEED
            sub r1, r1, r0
            cma r1, 128
            brt nzero, .endFallDamageBedrock
                lim r0, FALLDAMAGESCALING
                smul446 r1, r1, r0
                psh r2
                    mld r2, health
                    sub r2, r2, r1
                    brt nzero, .dieFromFallDamageBedrock
                    cma r2, 128
                    brt zero, .dieFromFallDamageBedrock
                    mst r2, health
                pop r2
            .endFallDamageBedrock
            lim r0, 255
            mst r0, onGround
            mst r0, velY

    .endCollideWithBedrock
    pld r0, %playerinput

    cal .updateAllItems

    cal .updateAllFurnaces

    pld r0, %switchbanks
    cal .doRandomTicks


    // do rendering stuff
        // check if full render is necessary
        mld r1, needReRender
        brt nzero, .doFullRender

        // check if player moved
        mld r1, prevX
        mld r2, x
        mst r2, prevX
        sub r0, r1, r2
        brt nzero, .doFullRender

        mld r1, prevY
        mld r2, y
        mst r2, prevY
        sub r0, r1, r2
        brt nzero, .doFullRender

        mld r1, prevZ
        mld r2, z
        mst r2, prevZ
        sub r0, r1, r2
        brt nzero, .doFullRender

    // if full render not necessary:
        jmp .renderUI
    
    .doFullRender
        jmp .finishRender






.PAGE:
.finishRender
    pld r0, %amogus_clearbuffer

    mld r1, rot
    pst r1, %amogus_camrot

    mld r1, x
    lim r0, PLAYERHALFWIDTH
    add r1, r1, r0
    pst r1, %amogus_camx

    mld r1, z
    lim r0, PLAYERHALFWIDTH
    add r1, r1, r0
    pst r1, %amogus_camz

    mld r1, y
    lim r2, PLAYERCAMHEIGHT
    mld r3, crouching
    brt zero, ~+2
        lim r2, PLAYERCROUCHCAMHEIGHT
    add r1, r1, r2
    pst r1, %amogus_camy

    pld r0, %meshgen_renderscene
    
    cal .renderBlockEntityFaces

    cal .rayCast
    cmp r5, 0
    brt zero, ~+9
        cal .getRayCastTargetQuad
        cal .buildQuadFromStack
        lim r0, 0b1101
        pst r0, %amogus_settings
        lim r0, TEXTURE_HIGHLIGHT0
        pst r0, %amogus_tex
        pld r0, %amogus_drawquad
        ssp 255
    
    pld r0, %amogus_drawtoscreen
    .renderUI
    cal .drawHotbar

    pld r0, %screen_buffer
    lim r0, 0
    mst r0, needReRender
jmp .mainLoop






.PAGE:
.getBlockType
    // stone blocks
        cmp r5, BLOCK_STONE
        brn zero, ~+9
        cmp r5, BLOCK_COBBLE
        brn zero, ~+7
        cmp r5, BLOCK_IRONORE
        brn zero, ~+5
        cmp r5, BLOCK_COALORE
        brn zero, ~+3
        cmp r5, BLOCK_FURNACE
        brt nzero, ~+3
            lim r7, BLOCKTYPE_STONE
            ret
    // wood blocks
        cmp r5, BLOCK_PLANK
        brn zero, ~+7
        cmp r5, BLOCK_LOG
        brn zero, ~+5
        cmp r5, BLOCK_TABLE
        brn zero, ~+3
        cmp r5, BLOCK_CHEST
        brt nzero, ~+3
            lim r7, BLOCKTYPE_WOOD
            ret
    // soft blocks
        cmp r5, BLOCK_SAND
        brn zero, ~+5
        cmp r5, BLOCK_DIRT
        brn zero, ~+3
        cmp r5, BLOCK_GRASS
        brt nzero, ~+3
            lim r7, BLOCKTYPE_SOFT
            ret
    // leaves
        cmp r5, BLOCK_LEAVES
        brt nzero, ~+3
            lim r7, BLOCKTYPE_LEAVES
            ret
    // glass
        cmp r5, BLOCK_GLASS
        brt nzero, ~+3
            lim r7, BLOCKTYPE_GLASS
            ret
    // sapling
        lim r7, BLOCKTYPE_SAPLING
ret






.PAGE:
.getBlockHardness
    // hardness 0
        cmp r5, BLOCK_LEAVES
        brn zero, ~+7
        cmp r5, BLOCK_SAND
        brn zero, ~+5
        cmp r5, BLOCK_DIRT
        brn zero, ~+3
        cmp r5, BLOCK_GRASS
        brt nzero, ~+3
            lim r7, 0
            ret
    // hardness 1
        cmp r5, BLOCK_GLASS
        brn zero, ~+9
        cmp r5, BLOCK_PLANK
        brn zero, ~+7
        cmp r5, BLOCK_LOG
        brn zero, ~+5
        cmp r5, BLOCK_TABLE
        brn zero, ~+3
        cmp r5, BLOCK_CHEST
        brt nzero, ~+3
            lim r7, 1
            ret
    // hardness 2
        cmp r5, BLOCK_STONE
        brn zero, ~+7
        cmp r5, BLOCK_COBBLE
        brn zero, ~+5
        cmp r5, BLOCK_COALORE
        brn zero, ~+3
        cmp r5, BLOCK_FURNACE
        brt nzero, ~+3
            lim r7, 2
            ret
    // hardness 3
        lim r7, 3
ret

.targetNegXQuad2
    cal .getRayCastTargetQuadBeginning

    cal .pushRegister6FourTimes

    add r6, r7, r5
    psh r7
    psh r7
    psh r6
    psh r6

    bsli r7, r4, 4
    add r6, r7, r5
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad







.PAGE:
.drawHotbar
    // draw highlight
    lim r0, 19
    pst r0, %screen_x1
    lim r0, 51
    pst r0, %screen_y1
    lim r0, 76
    pst r0, %screen_x2
    lim r0, 63
    pst r0, %screen_y2_clearrect

    // draw borders
    lim r0, 20
    pst r0, %screen_x1
    lim r0, 52
    pst r0, %screen_y1
    lim r0, 75
    pst r0, %screen_x2
    lim r0, 63
    pst r0, %screen_y2_drawrect
    pld r0, %screen_nop

    // draw items
    lim r1, 21
    lim r2, 53
    lim r5, 5
    lim r6, inventory
    mld r7, inventorySlot
    cal .drawGUIRow

    // draw hearts
    lim r0, 43
    pst r0, %screen_y1
    lim r1, 19
    lim r0, TEXTURE_HEARTEMPTY
    pst r0, %screen_texid
    .drawEmptyHeartsLoop
        pst r1, %screen_x1
        pld r0, %screen_drawinvtex
        adi r1, r1, 6
        cmp r1, 61
        brt lesseq, .drawEmptyHeartsLoop
    lim r1, 19
    lim r2, 1
    mld r3, health
    lim r0, TEXTURE_HEARTFULL
    pst r0, %screen_texid
    .drawFullHeartsLoop
        pst r1, %screen_x1
        pld r0, %screen_drawtex
        adi r1, r1, 6
        adi r2, r2, 1
        sub r0, r2, r3
        brt lesseq, .drawFullHeartsLoop
ret
    
.updateFurnaceFuel
    cmp r5, ITEM_STICK
    brt zero, ~+11
    cmp r5, ITEM_WOODPICKAXE
    brt zero, ~+9
    cmp r5, ITEM_WOODSHOVEL
    brt zero, ~+7
    cmp r5, ITEM_WOODSWORD
    brt zero, ~+5
    cmp r5, ITEM_WOODAXE
    brt zero, ~+3
    cmp r5, ITEM_SAPLING
    brt nzero, ~+2
        adi r3, r3, 1
    cmp r5, ITEM_COAL
    brt nzero, ~+2
        adi r3, r3, 8
ret
    






.PAGE:
.drawEnties
    lim r1, itemEntities
    .renderItemEntitiesLoop
        poi r1
        mld r2, 0
        brt zero, .renderItemEntitiesNext
            aim r2, 0x0F
            pst r2, %meshgen_itemid

            poi r1
            mld r2, 1
            pst r2, %meshgen_itemxz

            poi r1
            mld r2, 2
            pst r2, %meshgen_itemy
            pld r0, %meshgen_renderitem
        .renderItemEntitiesNext
        adi r1, r1, 3
    cmp r1, blockEntities
    brt less, .renderItemEntitiesLoop
ret

.createEntity
    mld r1, newestItemEntity
    adi r1, r1, 3
    cmp r1, blockEntities
    brt less, ~+2
        lim r1, itemEntities
    mst r1, newestItemEntity
    poi r1
    mst r5, 0
    bsli r2, r3, 1
    cmp r5, ENTITY_FALLINGSAND
    brt nzero, ~+3
        lim r5, 0
    jmp ~+2
        pld r5, %rng
    mov r6, r5
    aim r6, 0x11
    or r2, r2, r6
    poi r1
    mst r2, 1
    bsli r2, r4, 4
    bsri r5, r5, 1
    mov r6, r5
    aim r6, 0x07
    or r2, r2, r6
    poi r1
    mst r2, 2
ret

.useTargetedBlock
    mov r7, r4
    mov r6, r3
    cal .findBlockEntity
    cmp r1, 0
    brt nzero, ~+2
        jmp .endUseTargetedBlock
    mst r1, loadedTileEntity

    pld r0, %switchbanks
    aim r2, 0b01000000
    brt zero, ~+2
        jmp .goFromOpenChest
    jmp .goFromOpenFurnace







.PAGE:
.drawItem
    // draw first rectangle
    pst r1, %screen_x1
    pst r2, %screen_y1
    adi r1, r1, 9
    adi r2, r2, 9
    pst r1, %screen_x2
    pst r2, %screen_y2
    adi r1, r1, -8
    adi r2, r2, -8
    cmp r4, 0
    brt nzero, .drawItemNotSelected
        // draw selected outline
        pld r0, %screen_drawrect
        pst r1, %screen_x1
        pst r2, %screen_y1
        adi r1, r1, 7
        adi r2, r2, 7
        pst r1, %screen_x2
        pst r2, %screen_y2
        adi r1, r1, -7
        adi r2, r2, -7
    .drawItemNotSelected
    pld r0, %screen_clearrect
    cmp r3, 0
    brt nzero, .drawItemNonZero

        .drawItemReturn
        pld r0, %screen_nop
        adi r1, r1, -1
        adi r2, r2, -1
        ret
    .drawItemNonZero
    pst r1, %screen_x1
    pst r2, %screen_y1
    cmp r3, 0xF0
    brt grtreq, .drawItemNonstackable
        // draw stackable item
        bsri r4, r3, 4
        lim r0, TEXTURE_STACKABLE
        add r4, r4, r0
        pst r4, %screen_texid_drawtex

        // draw item count
        aim r3, 0x0F
        lim r0, TEXTURE_NUMBER
        add r3, r3, r0
        adi r1, r1, 2
        adi r2, r2, 2
        pst r1, %screen_x1
        pst r2, %screen_y1
        pst r3, %screen_texid_drawtex
        lim r0, 16
        add r3, r3, r0
        pst r3, %screen_texid_drawinvtex
        adi r1, r1, -3
        pld r0, %screen_nop
        adi r2, r2, -3
        ret
    
    .drawItemNonstackable
        // draw nonstackable item
        aim r3, 0x0F
        lim r0, TEXTURE_NONSTACKABLE
        add r3, r3, r0
        pst r3, %screen_texid_drawtex
        jmp .drawItemReturn

.drawGUIRow
    sub r7, r5, r7
    .drawGUIRowLoop
        poi r6
        mld r3, 0
        sub r4, r5, r7
        cal .drawItem
        adi r1, r1, 11
        adi r6, r6, 1
        adi r5, r5, -1
        brt nzero, .drawGUIRowLoop
    ret
// end






.PAGE:
.rayCast
    pld r0, %blockram_oobinactive

    mld r1, x
    lim r0, PLAYERHALFWIDTH
    add r1, r1, r0
    mov r5, r1
    aim r5, 0x0F
    bsri r1, r1, 4

    mld r2, y
    lim r0, PLAYERCAMHEIGHT
    add r2, r2, r0
    mov r6, r2
    aim r6, 0x0F
    bsri r2, r2, 4
    
    mld r3, z
    lim r0, PLAYERHALFWIDTH
    add r3, r3, r0
    mov r7, r3
    aim r7, 0x0F
    bsri r3, r3, 4

    // set up initial X t values
        pld r4, %amogus_camdirx
        cma r4, 128
        brt nzero, ~+4
            lim r0, BLOCKSIZE
            sub r5, r0, r5
            jmp ~+2
        sub r4, r0, r4
        sdiv446 r5, r5, r4
        lim r0, 0x10
        sdiv446 r4, r0, r4
        cmp r4, RAYCASTMAXLENGTH
        brt lesseq, ~+2
            lim r4, RAYCASTMAXLENGTH
        psh r4

    // set up initial Y t values
        pld r4, %amogus_camdiry
        cma r4, 128
        brt nzero, ~+4
            lim r0, BLOCKSIZE
            sub r6, r0, r6
            jmp ~+2
        sub r4, r0, r4
        sdiv446 r6, r6, r4
        lim r0, 0x10
        sdiv446 r4, r0, r4
        cmp r4, RAYCASTMAXLENGTH
        brt lesseq, ~+2
            lim r4, RAYCASTMAXLENGTH
        psh r4

    // set up initial Z t values
        pld r4, %amogus_camdirz
        cma r4, 128
        brt nzero, ~+4
            lim r0, BLOCKSIZE
            sub r7, r0, r7
            jmp ~+2
        sub r4, r0, r4
        sdiv446 r7, r7, r4
        lim r0, 0x10
        sdiv446 r4, r0, r4
        cmp r4, RAYCASTMAXLENGTH
        brt lesseq, ~+2
            lim r4, RAYCASTMAXLENGTH
        psh r4
jmp .beginRayCast






.PAGE:
.beginRayCast
    pst r1, %blockram_x
    pst r2, %blockram_y
    pst r3, %blockram_z
    bsli r1, r1, 4
    or r3, r1, r3
    mov r4, r2

jmp .rayCastFunctionLoop


.rayCastFunctionStepX
    cmp r5, RAYCASTMAXLENGTH
    brt lesseq, ~+4
        lim r5, 0
        lim r6, -1
        jmp .rayCastFunctionEnd

    psh r5
        pld r5, %amogus_camdirx
        cma r5, 128
        brt nzero, ~+4
            lim r0, 0x10
            addv r3, r3, r0
        jmp ~+3
            lim r0, 0xF0
            addv r3, r3, r0
        bsri r5, r3, 4
        pst r5, %blockram_x

        // fetch the new block
            pld r5, %blockram_id
            brt zero, ~+3
                pop r6
                jmp .rayCastFunctionEnd
    pop r5
    popu r1, 2
    add r5, r5, r1
jmp .rayCastFunctionLoop


.rayCastFunctionStepZFull
    cmp r7, RAYCASTMAXLENGTH
    brt lesseq, ~+4
        lim r5, 0
        lim r6, -1
        jmp .rayCastFunctionEnd

    psh r5
        pld r5, %amogus_camdirz
        cma r5, 128
        brt nzero, ~+4
            lim r0, 0x01
            addv r3, r3, r0
        jmp ~+3
            lim r0, 0x0F
            addv r3, r3, r0
        lim r0, 0x0F
        and r5, r3, r0
        pst r5, %blockram_z

        // fetch the new block
            pld r5, %blockram_id
            brt zero, ~+4
                pop r0
                mov r6, r7
                jmp .rayCastFunctionEnd
    pop r5
    popu r1, 0
    add r7, r7, r1
jmp .rayCastFunctionLoop







.PAGE:
.rayCastFunctionLoop
    mov r1, r3
    mov r2, r4
    sub r0, r5, r6
    brt greater, .rayCastFunctionDontStepX
        sub r0, r5, r7
        brt greater, .rayCastFunctionStepZ
            
            jmp .rayCastFunctionStepX

            .rayCastFunctionStepZ
            jmp .rayCastFunctionStepZFull

            .rayCastFunctionDontStepX
            sub r0, r6, r7
            brt greater, .rayCastFunctionStepZ

                .rayCastFunctionStepY
                    cmp r6, RAYCASTMAXLENGTH
                    brt lesseq, ~+4
                        lim r5, 0
                        lim r6, -1
                        jmp .rayCastFunctionEnd

                    psh r5
                        pld r5, %amogus_camdiry
                        cma r5, 128
                        brt nzero, ~+3
                            adi r4, r4, 1
                        jmp ~+2
                            adi r4, r4, -1
                        pst r4, %blockram_y

                        // fetch the new block
                            cmp r4, -1
                            brt nzero, ~+4
                                pop r0
                                lim r5, -1
                                jmp .rayCastFunctionEnd
                            pld r5, %blockram_id
                            brt zero, ~+3
                                pop r0
                                jmp .rayCastFunctionEnd
                    pop r5
                    popu r1, 1
                    add r6, r6, r1
                jmp .rayCastFunctionLoop
    .rayCastFunctionEnd
        pop r0
        pop r0
        pop r0
ret

.targetPosXQuad2
    cal .getRayCastTargetQuadBeginning

    add r6, r6, r5
    cal .pushRegister6FourTimes

    add r6, r7, r5
    psh r6
    psh r6
    psh r7
    psh r7

    bsli r7, r4, 4
    add r6, r7, r5
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad







.PAGE:
.getRayCastTargetQuad
    // get quad vertices
        sub r0, r2, r4
        brt greater, .targetPosYQuad
        brt less, .targetNegYQuad

        lim r0, 0xF0
        and r6, r1, r0
        lim r0, 0xF0
        and r7, r3, r0
        sub r0, r6, r7
        brt greater, .targetPosXQuad
        brt less, .targetNegXQuad

        lim r0, 0x0F
        and r6, r1, r0
        lim r0, 0x0F
        and r7, r3, r0
        sub r0, r6, r7
        brt greater, .targetPosZQuad
        jmp .targetNegXQuad

    .targetPosYQuad
        jmp .targetPosYQuad2
    .targetPosXQuad
        jmp .targetPosXQuad2
    .targetPosZQuad
        jmp .targetPosZQuad2

    .targetNegYQuad
        jmp .targetNegYQuad2
    .targetNegXQuad
        jmp .targetNegXQuad2
    .targetNegZQuad
        jmp .targetNegZQuad2

.endGetQuad
    lim r0, 0x80
    psh r0
    lim r0, 0x88
    psh r0
    lim r0, 0x08
    psh r0
    lim r0, 0x00
    psh r0
    popu r5, 16
ret

.buildQuadFromStack
    psh r0
    psh r0
    psh r0
    psh r0
    lim r2, 0
    .buildQuadFromStackLoop
        popu r1, 4
        pst r1, %amogus_vertuv
        popu r1, 8
        pst r1, %amogus_verty
        popu r1, 12
        pst r1, %amogus_vertz
        popu r1, 16
        pst r1, %amogus_vertx
        pld r0, %amogus_submitvert
        adi r2, r2, 1
        pop r0
    cmp r2, 4
    brt less, .buildQuadFromStackLoop
ret







.PAGE:
.targetNegZQuad2
    cal .getRayCastTargetQuadBeginning

    add r6, r6, r5
    psh r6
    psh r6
    sub r6, r6, r5
    psh r6
    psh r6
    
    psh r7
    psh r7
    psh r7
    psh r7

    bsli r7, r4, 4
    add r6, r7, r5
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad
    
.targetPosZQuad2
    cal .getRayCastTargetQuadBeginning

    psh r6
    psh r6
    add r6, r6, r5
    psh r6
    psh r6

    add r6, r7, r5
    cal .pushRegister6FourTimes

    bsli r7, r4, 4
    add r6, r7, r5
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad

.createChestEntity
    lim r1, blockEntities
    .findSpaceForChestLoop
        poi r1
        mld r2, 0
        brt nzero, ~+10
            adi r2, r1, 6
            cmp r2, endBlockEntities
            brt less, ~+2
                jmp .endBreakAndPlace
            poi r2, 0
            mld r2, 0
            brt nzero, ~+2
                jmp .foundSpaceForChest
            jmp ~+4
        aim r2, 0b11000000
        cmp r2, 0b01000000
        brt nzero, ~+2
            adi r1, r1, 6
        adi r1, r1, 6
        cmp r1, endBlockEntities
        brt less, .findSpaceForChestLoop
    jmp .endBreakAndPlace







.PAGE:
.targetNegYQuad2
    cal .getRayCastTargetQuadBeginning

    add r6, r6, r5
    psh r6
    psh r6
    sub r6, r6, r5
    psh r6
    psh r6

    add r6, r7, r5
    psh r6
    psh r7
    psh r7
    psh r6

    bsli r7, r4, 4
    psh r7
    psh r7
    psh r7
    psh r7

    jmp .endGetQuad
    
.targetPosYQuad2
    cal .getRayCastTargetQuadBeginning

    add r6, r6, r5
    psh r6
    psh r6
    sub r6, r6, r5
    psh r6
    psh r6

    add r6, r7, r5
    psh r7
    psh r6
    psh r6
    psh r7

    bsli r7, r4, 4
    add r6, r7, r5
    cal .pushRegister6FourTimes

    jmp .endGetQuad

.getRayCastTargetQuadBeginning
    lim r0, 0xF0
    and r6, r3, r0
    bsli r7, r3, 4

    psh r5
    cmp r5, BLOCK_CHEST
    brt zero, ~+3
        lim r5, 16
        ret
    lim r5, 14
    adi r6, r6, 1
    adi r7, r7, 1
ret

.pushRegister6FourTimes
    psh r6
    psh r6
    psh r6
    psh r6
ret









.PAGE:
.updateAllItems
    lim r1, itemEntities
    .updateItemEntitiesLoop
        poi r1
        mld r2, 0
        brt nzero, ~+2
        jmp .updateItemEntitiesNext

            // if near player and is not falling sand:
                lim r0, 0x0F
                and r3, r2, r0
                cmp r3, ENTITY_FALLINGSAND
                brt zero, .endPickUpItem2

                adi r3, r1, 1
                poi r3
                mld r3, 0

            // x
                lim r0, 0xF0
                and r4, r3, r0
                bsri r4, r4, 1

                mld r5, x
                lim r0, PICKUPSIDENEG
                sub r6, r5, r0
                cmp r6, MIDDLEOFVOID
                brt lesseq, ~+2
                    lim r6, 0
                sub r0, r4, r6
                brn less, .endPickUpItem2

                lim r0, PICKUPSIDEPOS
                add r6, r5, r0
                sub r0, r4, r6
                brn greater, .endPickUpItem2
                
            // z
                lim r0, 0x0F
                and r4, r3, r0
                bsli r4, r4, 3

                mld r5, z
                lim r0, PICKUPSIDENEG
                sub r6, r5, r0
                cmp r6, MIDDLEOFVOID
                brt lesseq, ~+2
                    lim r6, 0
                sub r0, r4, r6
                brn less, .endPickUpItem2

                lim r0, PICKUPSIDEPOS
                add r6, r5, r0
                sub r0, r4, r6
                brn greater, .endPickUpItem2

            // y
                poi r1
                mld r4, 2

                mld r5, y
                lim r0, PICKUPDOWN
                sub r6, r5, r0
                cmp r6, MIDDLEOFVOID
                brt lesseq, ~+2
                    lim r6, 0
                sub r0, r4, r6
                brn less, .endPickUpItem2

                lim r0, PICKUPUP
                add r6, r5, r0
                sub r0, r4, r6
                brn greater, .endPickUpItem2

            jmp .convertEntityToItem
    
    .endPickUpItem2
        jmp .endPickUpItem






.PAGE:
    .convertEntityToItem
        lim r0, 0x0F
        and r3, r2, r0
        cmp r3, ENTITY_APPLE
        brt nzero, ~+3
            lim r7, 0xE1
            jmp .endConvertEntityToItem
        cmp r3, ENTITY_TABLE
        brt nzero, ~+3
            lim r7, ITEM_TABLE
            jmp .endConvertEntityToItem
        cmp r3, ENTITY_FURNACE
        brt nzero, ~+3
            lim r7, ITEM_FURNACE
            jmp .endConvertEntityToItem
        cmp r3, ENTITY_CHEST
        brt nzero, ~+3
            lim r7, ITEM_CHEST
            jmp .endConvertEntityToItem
        // entity item has same ID
            bsli r7, r3, 4
            adi r7, r7, 1
    .endConvertEntityToItem
        psh r1
            cal .addItemToInventory
        pop r1
        poi r1
        mst r0, 0
    .endPickUpItem
        poi r1
        mld r2, 0
        cmp r2, 0xF0
        brt grtreq, ~+3
            lim r0, 0x10
            addv r2, r2, r0
        poi r1
        mst r2, 0

        aim r2, 0xF0
        adi r3, r1, 2
        poi r3
        mld r3, 0
        sub r6, r3, r2
        cmp r6, MIDDLEOFVOID
        brt grtreq, ~+2
            lim r6, 0

        bsri r3, r3, 4
        bsri r4, r6, 4

        adi r2, r1, 1
        poi r2
        mld r2, 0
        bsri r5, r2, 5
        pst r5, %blockram_x

        mov r5, r2
        aim r5, 0x0F
        bsri r5, r5, 1
        pst r5, %blockram_z

    jmp .itemEntityCollisionLoop1






.PAGE:
.itemEntityCollisionLoop1
    pst r3, %blockram_y
    pld r2, %blockram_id
    cmp r3, BLOCKMIDDLEOFVOID
    brt grtreq, .itemEntityResolveCollisionLoop
    cmp r2, 0
    brt zero, .itemEntityCollisionLoop1Next
    cmp r2, BLOCK_SAPLING
    brt zero, .itemEntityCollisionLoop1Next
    .itemEntityResolveCollisionLoop
        adi r3, r3, 1
        pst r3, %blockram_y
        pld r5, %blockram_id
        cmp r3, 8
        brt grtreq, .itemEntityResolveCollision
        cmp r5, 0
        brt zero, .itemEntityResolveCollision
        cmp r5, BLOCK_SAPLING
        brt nzero, .itemEntityResolveCollisionLoop
        .itemEntityResolveCollision
            poi r1
            mld r2, 0
            mov r4, r2
            aim r4, 0x0F
            cmp r4, ENTITY_FALLINGSAND
            brt nzero, .itemEntityResolveCollisionNotFallingSand
                cmp r5, BLOCK_SAPLING
                brt nzero, .convertFallingSandToBlock
                    adi r2, r2, -1
                    poi r1
                    mst r2, 0
                    adi r2, r1, 1
                    poi r2
                    mld r4, 0
                    pld r5, %rng
                    aim r5, 0x11
                    or r4, r4, r5
                    poi r2
                    mst r4, 0
                    jmp .itemEntityResolveCollisionNotFallingSand
                .convertFallingSandToBlock
                    lim r0, BLOCK_SAND
                    pst r0, %blockram_id
                    poi r1
                    mst r0, 0
                    jmp .updateItemEntitiesNext
            .itemEntityResolveCollisionNotFallingSand
                bsli r3, r3, 4
                poi r1
                mst r3, 2
                poi r1
                mld r2, 0
                aim r2, 0x0F
                poi r1
                mst r2, 0
                jmp .updateItemEntitiesNext
        .itemEntityCollisionLoop1Next
            adi r3, r3, -1
            sub r0, r3, r4
            brt grtreq, .itemEntityCollisionLoop1
            adi r2, r1, 2
            poi r2
            mst r6, 0
    .updateItemEntitiesNext
    adi r1, r1, 3
    cmp r1, blockEntities
    brt grtreq, ~+2
        jmp .updateItemEntitiesLoop
ret






.PAGE:
.foundSpaceForChest
    lim r2, 0b01000000
    cal .getBlockEntityDirection
    
    loopsrc .endClearChestLoop
    loopcnt 9
        adi r1, r1, 1
        poi r1
        .endClearChestLoop
        mst r0, 0
    jmp .placeBlock

.getBlockEntityDirection
    mld r3, rot
    aim r3, 0x0F
    lim r0, 10
    addv r3, r3, r0
    bsri r3, r3, 2
    bsli r3, r3, 4
    or r2, r2, r3
    pop r3
    or r2, r2, r3
    poi r1
    mst r2, 0
    adi r1, r1, 1
    pop r2
    poi r1
    mst r2, 0
ret

.findBlockEntity
    lim r1, blockEntities
    .findBlockEntityLoop
        poi r1
        mld r2, 0
        brt zero, ~+10
            mov r3, r2
            aim r3, 0x0F
            sub r0, r3, r7
            brt nzero, ~+6
                poi r1
                mld r4, 1
                sub r0, r4, r6
                brt nzero, ~+2
                    ret
        aim r2, 0b01000000
        brt zero, ~+2
            adi r1, r1, 6
        adi r1, r1, 6
        cmp r1, endBlockEntities
        brt less, .findBlockEntityLoop
    lim r1, 0
ret

.getFurnaceFrontFace
    cmp r2, 0
    brt zero, ~+6
        lim r4, TEXTURE_FURNACEFRONTOFF
        poi r1
        mld r3, 5
        brt zero, ~+2
            lim r4, TEXTURE_FURNACEFRONTON
ret



.PAGE:
.renderBlockEntityFaces
    lim r1, blockEntities
    .renderBlockEntityFaceLoop
        poi r1
        mld r2, 0
        brt zero, .renderBlockEntityFaceLoopContinue
            mov r3, r2
            aim r3, 0x0F
            pst r3, %meshgen_blocky
            poi r1
            mld r3, 1
            pst r3, %meshgen_blockxz

            lim r4, TEXTURE_CHESTFRONT
            bsri r3, r2, 6
            aim r3, 1
            pst r3, %meshgen_settings
            bsri r3, r2, 4
            aim r3, 3
            pst r3, %meshgen_direction
            cal .getFurnaceFrontFace
            
            pst r4, %amogus_tex
            pst r0, %amogus_settings
            pld r0, %meshgen_renderface
    
    .renderBlockEntityFaceLoopContinue
    aim r2, 0b01000000
    brt zero, ~+2
        adi r1, r1, 6
    adi r1, r1, 6
    cmp r1, endBlockEntities
    brt less, .renderBlockEntityFaceLoop
ret

.updateAllFurnaces
    lim r0, ITEM_FURNACE
    pst r0, %craftrom
    lim r1, blockEntities
    .updateFurnaceLoop
        poi r1
        mld r2, 0
        cmp r2, 0x80
        brt grtreq, ~+2
        jmp .notFurnace
            lim r7, 0
            poi r2
            mld r2, 3
            pst r2, %craftrom
            nop  // to be safe
            pld r2, %craftrom
            brt zero, .endCheckValidSmelt
                poi r3
                mld r3, 4
                brt zero, ~+3
                    adi r7, r7, 1
                    jmp .endCheckValidSmelt
                lim r6, 0xF0
                and r4, r2, r6
                and r5, r3, r6
                sub r0, r4, r5
                brt nzero, .endCheckValidSmelt
                aim r2, 0x0F
                aim r3, 0x0F
                add r2, r2, r3
                cmp r2, 0x0F
                brt grtr, .endCheckValidSmelt
                    adi r7, r7, 1
            .endCheckValidSmelt
        jmp .continueFurnaceLoop






.PAGE:
.continueFurnaceLoop
        adi r2, r1, 5
        poi r2
        mld r3, 0
        cmp r3, 0x0F
        brt lesseq, .endSmeltTimer
            adi r3, r3, -16
            cmp r3, 0x0F
            brt grtr, .endSmeltTimer
            adi r3, r3, -1
            cmp r7, 0
            brt zero, .endSmeltTimer
                pld r4, %craftrom
                aim r4, 0x0F
                adi r5, r1, 4
                poi r5
                mld r6, 0
                brt zero, ~+3
                    addv r4, r4, r6
                jmp ~+2
                    pld r4, %craftrom
                poi r5
                mst r4, 0
                adi r4, r1, 3
                mld r5, 0
                adi r5, r5, -1
                cma r5, 0x0F
                brt nzero, ~+2
                    lim r5, 0
                poi r4
                mst r5, 0
                cmp r4, 0
                brt zero, .endUpdateCurrentFurnace
        .endSmeltTimer
        cmp r7, 0
        brt zero, .endUpdateCurrentFurnace
            cma r4, 0x0F
            brt nzero, .fuelTimerNotZero
                poi r1
                mld r4, 2
                mov r5, r4
                aim r5, 0xF0
                cmp r5, ITEM_PLANK
                brt zero, ~+3
                cmp r5, ITEM_LOG
                brt nzero, ~+2
                    adi r3, r3, 2

                cal .updateFurnaceFuel

                cma r4, 0x0F
                brt nzero, .endUpdateCurrentFurnace
            .fuelTimerNotZero
                cmp r3, 0x0F
                brt grtr, ~+3
                    lim r0, SMELTTIME
                    add r3, r3, r0
        .endUpdateCurrentFurnace
        poi r2
        mst r3, 0
        jmp .updateFurnaceLoopNext
    .notFurnace
    bsli r2, r2, 1
    cma r2, 128
    brt nzero, ~+2
        adi r1, r1, 6
    .updateFurnaceLoopNext
    adi r1, r1, 6
    cmp r1, endBlockEntities
    brt less, .updateFurnaceLoop
ret








.PAGE:
.addItemToInventory
    lim r1, 0
    mov r6, r7
    aim r6, 0xF0
    .addItemToInventoryStackLoop
        poi r1
        mld r2, inventory
        mov r3, r2
        aim r3, 0xF0
        sub r0, r3, r6
        brt nzero, .addItemToInventoryStackLoopContinue
        mov r4, r2
        aim r4, 0x0F
        mov r5, r7
        aim r5, 0x0F
        add r5, r4, r5
        cmp r5, 16
        brt grtreq, .addItemToInventoryStackStackTooBig
        add r3, r3, r5
        poi r1
        mst r3, inventory
        ret
        .addItemToInventoryStackStackTooBig
        lim r0, 15
        or r2, r2, r0
        poi r1
        mst r2, inventory
        adi r5, r5, -15
        add r7, r6, r5
        .addItemToInventoryStackLoopContinue
        adi r1, r1, 1
        cmp r1, 15
        brt less, .addItemToInventoryStackLoop
    lim r1, 0

    .addItemToInventoryLoop
        poi r1
        mld r2, inventory
        brt nzero, ~+4
            poi r1
            mst r7, inventory
            ret
        cmp r7, 0xF0
        brn grtreq, .addItemToInventoryLoopContinue
        mov r3, r2
        aim r3, 0xF0
        sub r0, r6, r3
        brt nzero, .addItemToInventoryLoopContinue
        mov r4, r2
        aim r4, 0x0F
        mov r5, r7
        aim r5, 0x0F
        add r5, r4, r5
        cmp r5, 16
        brt grtreq, .addItemToInventoryStackTooBig
        add r3, r3, r5
        poi r1
        mst r3, inventory
        ret
        .addItemToInventoryStackTooBig
        lim r0, 15
        or r2, r2, r0
        poi r1
        mst r2, inventory
        adi r5, r5, -15
        add r7, r6, r5
        .addItemToInventoryLoopContinue
        adi r1, r1, 1
        cmp r1, 15
        brt less, .addItemToInventoryLoop
    ret
// end




