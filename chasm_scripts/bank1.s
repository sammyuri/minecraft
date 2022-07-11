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
    mst r0, prevTargetXZ
    lim r0, 0x0F
    mst r0, prevTargetY
    lim r0, 0xFF
    mst r0, permanentSelectedSlot

    lim r0, 0x14
    mst r0, 13
    lim r0, 0x55
    mst r0, 14

jmp .mainLoop






.PAGE:
.mainLoop
    pst r0, %playerinput
    nop
    // is open/close inventory pressed?
        pld r1, %playerinput
        brt zero, ~+3
        pld r0, %switchbanks
        jmp .bank2_loadInventoryGUI

    .continueFromClosingInventory
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


        pld r7, %playerinput
        nop
        pld r7, %playerinput
        jmp .miscInputs




    
    // handle break/place
        cal .rayCast
            //r1: x, z pos of space before first found block
            //r2: y pos of space before first found block
            //r3: x, z pos of first found block
            //r4: y pos of first found block
            //r5: id of first found block (returns air if nothing found, bedrock will return -1)
            //r6: length of raycast (returns -1 if nothing found)
        mld r7, targetXZ
        mst r7, prevTargetXZ
        mst r3, targetXZ
        lim r6, 0
        sub r0, r3, r7
        brt nzero, ~+2
            lim r6, 255
        mld r7, targetY
        mst r7, prevTargetY
        mst r4, targetY
        lim r7, 0
        sub r0, r4, r7
        brt nzero, ~+2
            lim r7, 255
        and r6, r6, r7
        
        pld r7, %playerinput
        mld r6, inventorySlot
        poi r6
        mld r6, inventory
        cmp r5, 0
        brt nzero, ~+2
            jmp .noRayCastHit
        cmp r7, 0
        brt nzero, ~+2
            jmp .endBreakBlock
        jmp .handleBreak






.PAGE:
    .handleBreak
        cma r5, 128
        brt nzero, .endBreakBlock  // bedrock

            cal .getRayCastTargetQuad

            lim r6, TEXTURE_HIGHLIGHT0
            .blockBreakAnimLoop
                cal .buildQuadFromStack
                lim r0, 0b1101
                pst r0, %amogus_settings
                pst r6, %amogus_tex
                pld r0, %amogus_drawquad
                adi r6, r6, 1
                lim r2, 0
                .blockBreakAnimDelayLoop
                    add r2, r2, r7
                    psh r2
                    lim r2, 255
                    .blockBreakAnimDelaySubLoop
                        adi r7, r7, -1
                        brn nzero, .blockBreakAnimDelaySubLoop
                    pop r2
                    cmp r2, 16
                    brt lesseq, .blockBreakAnimDelayLoop
                    pld r0, %amogus_drawtoscreen
                    pld r0, %screen_buffer
                    cal .drawUI
                cmp r6, TEXTURE_HIGHLIGHT7
                brt lesseq, .blockBreakAnimLoop
            ssp 0  // reset stack pointer
        bsri r7, r3, 4
        pst r7, %blockram_x
        mov r7, r3
        aim r7, 0x0F
        pst r7, %blockram_z
        pst r4, %blockram_y

        pst r0, %blockram_id

        lim r0, 255
        mst r0, needReRender
        
        pld r0, %playerinput
        jmp .endBreakAndPlace
    
    .endBreakBlock
    pld r7, %playerinput  // place
    brt zero, .endBreakAndPlace
        mld r7, crouching
        bsri r7, r1, 4
        pst r7, %blockram_x
        mov r7, r1
        aim r7, 0x0F
        pst r7, %blockram_z
        pst r2, %blockram_y
        lim r0, BLOCK_GRASS
        pst r0, %blockram_id
        lim r0, 255
        mst r0, needReRender
    jmp .endBreakAndPlace

    .noRayCastHit
        lim r0, 0xFF
        mst r0, targetXZ
        lim r0, 0x0F
        mst r0, targetY
        pld r7, %playerinput
    .useNonPlaceable
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
        brt zero, ~+6
            mld r2, rot
            addv r2, r1, r2
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
        mld r1, %playerinput
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
    jmp .moveAndCollide






.PAGE:
.moveAndCollide
    // move and collide
    pld r0, %blockram_oobactive
    // prepare stack
        psh r1
        psh r5
        psh r4
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
        






.PAGE:
.collisionLoop
    popu r3, 0
    poi r3
    mld r2, r3
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



    hlt



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
                    brt nzero, .collideResolveEnd
                        lim r0, 255
                        mst r0, onGround
                        mst r0, velY
                        jmp .collideResolveEnd
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
                    brt nzero, .collideResolveEnd
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
.collisionLoopEnd
    ssp 0
    mld r1, y
    cmp r1, MIDDLEOFVOID
    brt lesseq, ~+5
        mst r0, y
        lim r0, 255
        mst r0, onGround
        mst r0, velY

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

    jmp .finishRender






.PAGE:
.finishRender
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
        ssp 0
    
    pld r0, %amogus_drawtoscreen
    .renderUI
    cal .drawUI

    pld r0, %screen_buffer
    mst r0, needReRender
jmp .mainLoop






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
    mov r6, r3
    aim r6, 0x0F
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
        bsri r5, r3, r4
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
            cmp r6, r7
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
                        pst r4, %blockram_x

                        // fetch the new block
                            cmp r4, -1
                            brt nzero, ~+4
                                pop r0
                                lim r5, -1
                                jmp .rayCastFunctionEnd
                            pld r5, %blockram_id
                            brt zero, ~+3
                                pop r6
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






.drawUI
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
ret







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
ret







.PAGE:
.targetNegZQuad2
    lim r0, 0xF0
    and r6, r3, r0
    bsli r7, r3, 4

    lim r0, 16
    add r6, r6, r0
    psh r6
    psh r6
    lim r0, -16
    add r6, r6, r0
    psh r6
    psh r6
    
    psh r7
    psh r7
    psh r7
    psh r7

    bsli r7, r4, 4
    lim r0, 16
    add r6, r7, r0
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad
    
.targetPosZQuad2
    lim r0, 0xF0
    and r6, r3, r0
    bsli r7, r3, 4

    psh r6
    psh r6
    lim r0, 16
    add r6, r6, r0
    psh r6
    psh r6

    lim r0, 16
    add r6, r7, r0
    psh r6
    psh r6
    psh r6
    psh r6

    bsli r7, r4, 4
    lim r0, 16
    add r6, r7, r0
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad







.PAGE:
.targetNegXQuad2
    lim r0, 0xF0
    and r6, r3, r0
    bsli r7, r3, 4

    psh r6
    psh r6
    psh r6
    psh r6

    lim r0, 16
    add r6, r7, r0
    psh r7
    psh r7
    psh r6
    psh r6

    bsli r7, r4, 4
    lim r0, 16
    add r6, r7, r0
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad

.targetPosXQuad2
    lim r0, 0xF0
    and r6, r3, r0
    bsli r7, r3, 4

    lim r0, 16
    add r6, r6, r0
    psh r6
    psh r6
    psh r6
    psh r6

    lim r0, 16
    add r6, r7, r0
    psh r6
    psh r6
    psh r7
    psh r7

    bsli r7, r4, 4
    lim r0, 16
    add r6, r7, r0
    psh r7
    psh r6
    psh r6
    psh r7

    jmp .endGetQuad







.PAGE:
.targetNegYQuad2
    lim r0, 0xF0
    and r6, r3, r0
    bsli r7, r3, 4

    lim r0, 16
    add r6, r6, r0
    psh r6
    psh r6
    lim r0, -16
    add r6, r6, r0
    psh r6
    psh r6

    lim r0, 16
    add r6, r7, r0
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
    lim r0, 0xF0
    and r6, r3, r0
    bsli r7, r3, 4

    lim r0, 16
    add r6, r6, r0
    psh r6
    psh r6
    lim r0, -16
    add r6, r6, r0
    psh r6
    psh r6

    lim r0, 16
    add r6, r7, r0
    psh r7
    psh r6
    psh r6
    psh r7

    bsli r7, r4, 4
    lim r0, 16
    add r6, r7, r0
    psh r6
    psh r6
    psh r6
    psh r6

    jmp .endGetQuad







.PAGE:
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
        lim r0, STACKABLE_TEXTURE
        add r4, r4, r0
        pst r4, %screen_texid_drawtex

        // draw item count
        aim r3, 0x0F
        lim r0, NUMBER
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
        lim r0, NONSTACKABLE_TEXTURE
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
