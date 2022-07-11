.BANK:

jmp .bank2_loadInventoryGUI




.PAGE
.bank2_multiplyXAndYBy11
    add r7, r7, r5  // adjust memory address by x
    lim r0, 11  // multiply
    mul r5, r5, r0
    lim r0, 11
    mul r6, r6, r0
ret

.bank2_inventoryGetSlot
    // r5: x (returned)
    // r6: y (returned)
    // r7: slot, address (returned)
    // NOTE: for chests and furnaces (tile entitites), return address is relative within them
    bsri r6, r7, 4  // split x and y
    lim r0, 0x0F
    and r5, r7, r0  // x

    cmp r7, 0x10  // on hotbar
    brt grtreq, ~+7
        lim r7, inventory  // memory address
        cal .bank2_multiplyXAndYBy11
        lim r6, 53  // y
        lim r0, 21
        add r5, r5, r0  // x
        ret
    cmp r7, 0x30  // within main inventory
    brt grtreq, ~+10
        lim r0, 5
        mul r7, r6, r0  // memory address
        adi r7, r7, inventory
        cal .bank2_multiplyXAndYBy11
        lim r0, 52
        sub r6, r0, r6  // y
        lim r0, 21
        add r5, r5, r0  // x
        ret
    cmp r7, 0x50  // within chest
    brt grtreq, ~+10
        adi r6, r6, -3
        lim r0, 5
        mul r7, r6, r0  // memory address
        cal .bank2_multiplyXAndYBy11
        lim r0, 18
        sub r6, r0, r6  // y
        lim r0, 21
        add r5, r5, r0  // x
        ret
    cmp r7, 0x70  // within small crafting grid
    brt grtreq, ~+19
        lim r0, 6
        sub r6, r0, r6
        lim r0, 3
        mul r7, r6, r0  // memory address
        lim r0, 1
        sub r6, r0, r6
        lim r0, craftingGrid
        add r7, r7, r0
        add r7, r7, r5  // adjust memory address by x
        lim r0, 9
        mul r5, r5, r0  // multiply
        lim r0, 9
        mul r6, r6, r0
        lim r0, 18
        sub r6, r0, r6  // y
        lim r0, 26
        add r5, r5, r0  // x
        ret
    jmp .bank2_inventoryGetSlot_2





.PAGE:
.bank2_inventoryGetSlot_2
    cmp r7, 0xA0  // within large crafting grid
    brt grtreq, ~+19
        lim r0, 9
        sub r6, r0, r6
        lim r0, 3
        mul r7, r6, r0  // memory address
        lim r0, 2
        sub r6, r0, r6
        lim r0, craftingGrid
        add r7, r7, r0
        add r7, r7, r5  // adjust memory address by x
        lim r0, 9
        mul r5, r5, r0  // multiply
        lim r0, 9
        mul r6, r6, r0
        lim r0, 19
        sub r6, r0, r6  // y
        lim r0, 21
        add r5, r5, r0  // x
        ret
    // TODO: furnace

    lim r6, 0xFF  // out of bounds
ret






.PAGE:
.bank2_drawItem
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
    brt nzero, .bank2_drawItemNotSelected
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
    .bank2_drawItemNotSelected
    pld r0, %screen_clearrect
    cmp r3, 0
    brt nzero, .bank2_drawItemNonZero

        .bank2_drawItemReturn
        pld r0, %screen_nop
        adi r1, r1, -1
        adi r2, r2, -1
        ret
    .bank2_drawItemNonZero
    pst r1, %screen_x1
    pst r2, %screen_y1
    cmp r3, 0xF0
    brt grtreq, .bank2_drawItemNonstackable
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
    
    .bank2_drawItemNonstackable
        // draw nonstackable item
        aim r3, 0x0F
        lim r0, NONSTACKABLE_TEXTURE
        add r3, r3, r0
        pst r3, %screen_texid_drawtex
        jmp .bank2_drawItemReturn

.bank2_drawGUIRow
    sub r7, r5, r7
    .bank2_drawGUIRowLoop
        poi r6
        mld r3, 0
        sub r4, r5, r7
        cal .bank2_drawItem
        adi r1, r1, 11
        adi r6, r6, 1
        adi r5, r5, -1
        brt nzero, .bank2_drawGUIRowLoop
    ret
// end






.PAGE:

.bank2_highlightRectangle1
    pst r1, %screen_x1
    pst r2, %screen_y1
    pst r2, %screen_y2
    adi r1, r1, 9
    pst r1, %screen_x2
ret

.bank2_highlightRectangle2
    pst r1, %screen_x1
    adi r2, r2, 9
    pst r2, %screen_y2
ret

.bank2_highlightRectangle3
    pst r2, %screen_y1
    adi r1, r1, -9
    pst r1, %screen_x1
ret

.bank2_highlightRectangle4
    pst r1, %screen_x2
    adi r2, r2, -9
    pst r2, %screen_y1
ret

.bank2_drawHighlight
    cal .bank2_highlightRectangle1
    pld r0, %screen_drawrect
    cal .bank2_highlightRectangle2
    pld r0, %screen_drawrect
    cal .bank2_highlightRectangle3
    pld r0, %screen_drawrect
    cal .bank2_highlightRectangle4
    pld r0, %screen_drawrect
    nop
ret

.bank2_clearHighlight
    cal .bank2_highlightRectangle1
    pld r0, %screen_clearrect
    cal .bank2_highlightRectangle2
    pld r0, %screen_clearrect
    cal .bank2_highlightRectangle3
    pld r0, %screen_clearrect
    cal .bank2_highlightRectangle4
    pld r0, %screen_clearrect
    nop
ret







.PAGE:
.bank2_drawItemInGrid
    // draw first rectangle
    adi r1, r1, 1
    adi r2, r2, 1
    pst r1, %screen_x1
    pst r2, %screen_y1
    adi r1, r1, 7
    adi r2, r2, 7
    pst r1, %screen_x2
    pst r2, %screen_y2
    adi r1, r1, -7
    adi r2, r2, -7
    pld r0, %screen_clearrect

    pst r1, %screen_x1
    pst r2, %screen_y1
    cmp r3, 0
    brt nzero, .bank2_drawItemInGridNonZero

        lim r0, GUI_EMPTY
        pst r0, %screen_texid_drawtex
        .bank2_drawItemInGridReturn
        adi r1, r1, -1
        pld r0, %screen_nop
        adi r2, r2, -1
        ret
    
    .bank2_drawItemInGridNonZero
    cmp r3, 0xF0
    brt grtreq, .bank2_drawItemNonstackable
        // draw stackable item
        bsri r3, r3, 4
        lim r0, STACKABLE_TEXTURE
        add r3, r3, r0
        pst r3, %screen_texid_drawtex
        jmp .bank2_drawItemInGridReturn
    
    .bank2_drawItemInGridNonstackable
        // draw nonstackable item
        aim r3, 0x0F
        lim r0, NONSTACKABLE_TEXTURE
        add r3, r3, r0
        pst r3, %screen_texid_drawtex
        jmp .bank2_drawItemInGridReturn

.bank2_drawGUIRowInGrid
    .bank2_drawGUIRowInGridLoop
        poi r6
        mld r3, 0
        cal .bank2_drawItemInGrid
        adi r1, r1, 9
        adi r6, r6, 1
        adi r5, r5, -1
        brt nzero, .bank2_drawGUIRowLoop
    ret
// end






.PAGE:
.bank2_drawInventory
    lim r0, 19
    pst r0, %screen_x1
    pst r0, %screen_y1
    lim r0, 76
    pst r0, %screen_x2
    lim r0, 63
    pst r0, %screen_y2_clearrect

    lim r0, 20
    pst r0, %screen_x1
    pst r0, %screen_y1
    lim r0, 75
    pst r0, %screen_x2
    lim r0, 63
    pst r0, %screen_y2_drawrect

.bank2_drawInventoryOnlyInventoryPart
    lim r0, 19
    pst r0, %screen_x1
    lim r0, 29
    pst r0, %screen_y1
    lim r0, 76
    pst r0, %screen_x2
    lim r0, 63
    pst r0, %screen_y2_clearrect
    pld r0, %screen_nop

    lim r0, 20
    pst r0, %screen_x1
    lim r0, 29
    pst r0, %screen_y1
    lim r0, 75
    pst r0, %screen_x2
    lim r0, 63
    pst r0, %screen_y2_drawrect

    lim r1, 21
    lim r2, 53
    lim r5, 5
    lim r6, inventory
    mld r7, inventorySlot
    cal .bank2_drawGUIRow

    adi r2, r2, -12
    lim r1, 21
    lim r5, 5
    mld r7, inventorySlot
    adi r7, r7, -16
    cal .bank2_drawGUIRow

    adi r2, r2, -11
    lim r1, 21
    lim r5, 5
    mld r7, inventorySlot
    adi r7, r7, -16
    adi r7, r7, -16
    cal .bank2_drawGUIRow
ret






.PAGE:
.bank2_addItemToInventory
    lim r1, 0
    mov r6, r7
    aim r6, 0xF0
    .bank2_addItemToInventoryLoop
        poi r1
        mld r2, inventory
        brt nzero, ~+4
            poi r1
            mst r7, inventory
            ret
        cmp r7, 0xF0
        brn grtreq, .bank2_addItemToInventoryLoopContinue
        mov r3, r2
        aim r3, 0xF0
        sub r0, r6, r3
        brt nzero, .bank2_addItemToInventoryLoopContinue
        mov r4, r2
        aim r4, 0x0F
        mov r5, r7
        aim r5, 0x0F
        add r5, r4, r5
        cmp r5, 16
        brt grtreq, .bank2_addItemToInventoryStackTooBig
        add r3, r3, r5
        poi r1
        mst r3, inventory
        ret
        .bank2_addItemToInventoryStackTooBig
        lim r0, 15
        or r2, r2, r0
        poi r1
        mst r2, inventory
        adi r5, r5, -15
        add r7, r6, r5
        .bank2_addItemToInventoryLoopContinue
        adi r1, r1, 1
        cmp r1, 15
        brt less, .bank2_addItemToInventoryLoop
    ret
// end






.PAGE:
.bank2_tryCrafting
    lim r2, 0
    loopsrc .bank2_tryCraftingToStackLoop
    loopcnt 14
        poi r2
        mld r3, inventory
        psh r3
        .bank2_tryCraftingToStackLoop
        adi r2, r2, 1

    lim r1, 0
    .bank2_tryCraftingMainLoop
        poi r1
        mld r2, craftingGrid
        aim r2, 0xF0
        brt zero, .bank2_tryCraftingLoopContinue
        lim r3, 0
        .bank2_tryCraftingSubLoop
            poi r3
            mld r4, inventory
            mov r5, r4
            aim r5, 0xF0
            sub r0, r2, r5
            brn zero, .bank2_tryCraftingLoopItemMatch
            adi r3, r3, 1
            cmp r3, 15
            brt less, .bank2_tryCraftingSubLoop
        jmp .bank2_tryCraftingFailure

        .bank2_tryCraftingLoopItemMatch
        adi r4, r4, -1
        mov r5, r4
        aim r5, 0x0F
        brt nzero, ~+2
            lim r4, 0
        poi r3
        mst r4, inventory
        .bank2_tryCraftingLoopContinue
        adi r1, r1, 1
        cmp r1, 9
        brt less, .bank2_tryCraftingMainLoop
    
    // success
        mld r7, craftingOutput
        cal .bank2_addItemToInventory

        loopsrc .bank2_tryCraftingClearStackLoop
        loopcnt 4
            pop r0
            pop r0
            .bank2_tryCraftingClearStackLoop
            pop r0
        lim r0, 0xFF
        mst r0, permanentSelectedSlot
        cal .bank2_drawInventoryOnlyInventoryPart
    ret

    // failure
    .bank2_tryCraftingFailure
        lim r2, 14
        .bank2_tryCraftingFromStackLoop
            pop r3
            poi r2
            mst r3, inventory
            adi r2, r2, -1
            brt grtreq, .bank2_tryCraftingFromStackLoop
        ret
// end










// PLAYER INVENTORY (2x2 crafting grid)







.PAGE:
.bank2_inventoryDrawSlotWithHighlight
    cal .bank2_inventoryGetSlot
    cmp r6, 0xFF
    brt nequal, ~+2
        ret
    poi r7
    mld r3, 0
    mov r1, r5
    mov r2, r6
    cmp r6, 28
    brt grtreq, ~+4
        cal .bank2_drawItemInGrid
        cal .bank2_drawHighlight
        ret
    lim r4, 0
    cal .bank2_drawItem
ret

.bank2_inventoryMoveWithinInventory_2
    cmp r1, 0x10
    brt nzero, ~+6
        cmp r2, 0x20
        brt less, ~+3
            lim r2, 0x50
            jmp ~+2
        add r2, r2, r1
    cmp r1, 0xF0
    brt nzero, ~+7
        cmp r2, 0x10
        brt grtreq, ~+4
            lim r0, 0x20
            add r2, r2, r0
            jmp ~+2
        add r2, r2, r1
    cmp r1, 0x0F
    brt nzero, ~+8
        mov r3, r2
        aim r3, 0x0F
        cmp r3, 0
        brt nzero, ~+3
            adi r2, r2, 4
            jmp ~+2
        adi r2, r2, -1
    cmp r1, 0x01
    brt nzero, ~+8
        mov r3, r2
        aim r3, 0x0F
        cmp r3, 4
        brt nzero, ~+3
            adi r2, r2, -4
            jmp ~+2
        adi r2, r2, 1
ret








.PAGE:
.bank2_reset2x2CraftingGrid
    lim r1, 8
    .bank2_reset2x2CraftingGridLoop
        poi r1
        mst r0, craftingOutput
        adi r1, r1, -1
        brt grtreq, .bank2_reset2x2CraftingGridLoop
    
    lim r0, 26
    pst r0, %screen_x1
    lim r0, 9
    pst r0, %screen_y1
    lim r0, 44
    pst r0, %screen_x2
    lim r0, 27
    pst r0, %screen_y2_clearrect

    lim r7, craftingGrid
    lim r2, 9
    lim r1, 26
    lim r5, 2
    mov r6, r7
    cal .bank2_drawGUIRowInGrid

    lim r2, 18
    lim r1, 26
    lim r5, 2
    adi r6, r7, 3
    cal .bank2_drawGUIRowInGrid

    lim r1, 60
    lim r2, 14
    lim r3, 0
    lim r4, 1
    cal .bank2_drawItem
ret

.bank2_inventoryDrawSlotWithoutHighlight
    cal .bank2_inventoryGetSlot
    cmp r6, 0xFF
    brt nequal, ~+2
        ret
    poi r7
    mld r3, 0
    mov r1, r5
    mov r2, r6
    cmp r6, 28
    brt grtreq, ~+4
        cal .bank2_drawItemInGrid
        cal .bank2_clearHighlight
        ret
    lim r4, 1
    cal .bank2_drawItem
ret






.PAGE:
.bank2_loadInventoryGUI
    cal .bank2_drawInventory

    cal .bank2_reset2x2CraftingGrid

    lim r0, 1
    pst r0, %screen_y1
    lim r0, 40
    pst r0, %screen_x1
    lim r0, 0x70
    pst r0, %screen_texid_drawinvtex
    lim r0, 48
    pst r0, %screen_x1
    lim r0, 0x71
    pst r0, %screen_texid_drawinvtex
    lim r0, 56
    pst r0, %screen_x1
    lim r0, 0x72
    pst r0, %screen_texid_drawinvtex
    lim r0, 64
    pst r0, %screen_x1
    lim r0, 0x73
    pst r0, %screen_texid_drawinvtex
    lim r0, 72
    pst r0, %screen_x1
    lim r0, 0x74
    pst r0, %screen_texid_drawinvtex

    lim r0, 46
    pst r0, %screen_x1
    lim r0, 15
    pst r0, %screen_y1
    lim r1, GUI_ARROW
    pst r1, %screen_texid_drawinvtex
    lim r0, 54
    pst r0, %screen_x1
    adi r1, r1, 1
    pst r1, %screen_texid_drawinvtex

    lim r0, 0xFF
    mst r0, permanentSelectedSlot

    pld r0, %screen_buffer

.bank2_inventoryLoop
    pst r0, %playerinput
    nop
    pld r1, %playerinput
    brt zero, ~+3
        pld r0, %switchbanks
        jmp .continueFromClosingInventory
    jmp .bank2_inventoryHandleMovement







.PAGE:
.bank2_inventoryHandleMovement
    mld r2, inventorySlot
    pld r1, %playerinput
    brt zero, .bank2_inventorySkipMovement

    mld r7, inventorySlot
    psh r1
    cal .bank2_inventoryDrawSlotWithoutHighlight
    pop r1

    mld r2, inventorySlot
    cmp r2, 0x30
    brt less, .bank2_inventoryMoveWithinInventory

        cmp r1, 0x10
        brt nzero, ~+6
            cmp r2, 0x60
            brt less, ~+3
                lim r2, 0x00
                jmp ~+2
            add r2, r2, r1
        cmp r1, 0xF0
        brt nzero, ~+6
            cmp r2, 0x60
            brt grtreq, ~+3
                lim r2, 0x20
                jmp ~+2
            add r2, r2, r1
        cmp r1, 0x0F
        brt nzero, ~+3
            addv r2, r2, r1
            aim r2, 0xF1
        cmp r1, 0x01
        brt nzero, ~+3
            addv r2, r2, r1
            aim r2, 0xF1
        jmp .bank2_inventorySkipMovement

    .bank2_inventoryMoveWithinInventory
        cal .bank2_inventoryMoveWithinInventory_2
        
    .bank2_inventorySkipMovement
        mst r2, inventorySlot
        mov r7, r2
        cal .bank2_inventoryDrawSlotWithHighlight

        pld r1, %playerinput
        brt zero, .bank2_inventorySkipTryCrafting
        mld r1, craftingOutput
        brt zero, .bank2_inventorySkipTryCrafting

        cal .bank2_tryCrafting
        mld r7, inventorySlot
        cal .bank2_inventoryDrawSlotWithHighlight
    
    .bank2_inventorySkipTryCrafting
        jmp .bank2_inventorySelection






.PAGE:
.bank2_inventorySelection
    mld r7, permanentSelectedSlot
    cal .bank2_inventoryDrawSlotWithHighlight

    pld r1, %playerinput
    brt zero, .bank2_inventorySkipSelectItem

    mld r1, permanentSelectedSlot
    mld r2, inventorySlot
    cmp r1, 0xFF
    brt nzero, .bank2_inventorySelectedAlready
        cmp r2, 0x50
        brt grtreq, .bank2_inventorySkipSelectItem
        mst r2, permanentSelectedSlot
        jmp .bank2_inventorySkipSelectItem
    
    .bank2_inventorySelectedAlready
    mov r7, r1
    cal .bank2_inventoryGetSlot
    poi r7
    mld r3, 0
    mov r7, r2
    cal .bank2_inventoryGetSlot
    poi r7
    mld r4, 0
    poi r7
    mst r3, 0
    psh r4
    mov r7, r2
    cal .bank2_inventoryDrawSlotWithHighlight
    pop r4
    mld r1, permanentSelectedSlot
    mld r2, inventorySlot
    cmp r2, 0x50
    brt grtreq, .bank2_inventoryCheckCrafting
        
        mov r7, r1
        cal .bank2_inventoryGetSlot
        poi r7
        mst r4, 0
        mov r7, r1
        cal .bank2_inventoryDrawSlotWithoutHighlight
        lim r0, 0xFF
        mst r0, permanentSelectedSlot
        mld r7, inventorySlot
        cal .bank2_inventoryDrawSlotWithHighlight
        jmp .bank2_inventorySkipSelectItem
    
    .bank2_inventoryCheckCrafting
        lim r0, 0xFF
        pst r0, %craftrom
        lim r1, 9
        lim r2, 0
        .bank2_inventoryCheckCraftingLoop
            poi r2
            mld r3, craftingGrid
            pst r3, %craftrom
            adi r2, r2, 1
            adi r1, r1, -1
            brt nzero, .bank2_inventoryCheckCraftingLoop
        pld r3, %craftrom
        mst r3, craftingOutput
        lim r1, 60
        lim r2, 14
        lim r4, 1
        cal .bank2_drawItem
    
    .bank2_inventorySkipSelectItem
    jmp .bank2_inventoryFinishLoop






.PAGE:
.bank2_inventoryFinishLoop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop

    pld r1, %playerinput
    brt zero, .bank2_inventoryContinue
        cal .bank2_reset2x2CraftingGrid
        mld r7, inventorySlot
        cal .bank2_inventoryDrawSlotWithHighlight

    .bank2_inventoryContinue
    pld r0, %screen_buffer
jmp .bank2_inventoryLoop











// CRAFTING INVENTORY (3x3 crafting grid)







.PAGE:
.bank2_craftingDrawSlotWithHighlight
    cal .bank2_inventoryGetSlot
    cmp r6, 0xFF
    brt nequal, ~+2
        ret
    poi r7
    mld r3, 0
    mov r1, r5
    mov r2, r6
    cmp r6, 28
    brt grtreq, ~+4
        cal .bank2_drawItemInGrid
        cal .bank2_drawHighlight
        ret
    lim r4, 0
    cal .bank2_drawItem
ret

.bank2_craftingMoveWithinInventory_2
    cmp r1, 0x10
    brt nzero, ~+6
        cmp r2, 0x20
        brt less, ~+3
            lim r2, 0x70
            jmp ~+2
        add r2, r2, r1
    cmp r1, 0xF0
    brt nzero, ~+7
        cmp r2, 0x10
        brt grtreq, ~+4
            lim r0, 0x20
            add r2, r2, r0
            jmp ~+2
        add r2, r2, r1
    cmp r1, 0x0F
    brt nzero, ~+8
        mov r3, r2
        aim r3, 0x0F
        cmp r3, 0
        brt nzero, ~+3
            adi r2, r2, 4
            jmp ~+2
        adi r2, r2, -1
    cmp r1, 0x01
    brt nzero, ~+8
        mov r3, r2
        aim r3, 0x0F
        cmp r3, 4
        brt nzero, ~+3
            adi r2, r2, -4
            jmp ~+2
        adi r2, r2, 1
ret








.PAGE:
.bank2_reset3x3CraftingGrid
    lim r1, 8
    .bank2_reset3x3CraftingGridLoop
        poi r1
        mst r0, craftingOutput
        adi r1, r1, -1
        brt grtreq, .bank2_reset3x3CraftingGridLoop
    
    lim r0, 21
    pst r0, %screen_x1
    lim r0, 1
    pst r0, %screen_y1
    lim r0, 48
    pst r0, %screen_x2
    lim r0, 28
    pst r0, %screen_y2_clearrect

    lim r7, craftingGrid
    lim r2, 1
    lim r1, 21
    lim r5, 3
    mov r6, r7
    cal .bank2_drawGUIRowInGrid

    lim r2, 10
    lim r1, 21
    lim r5, 3
    adi r6, r7, 3
    cal .bank2_drawGUIRowInGrid
    
    lim r2, 19
    lim r1, 21
    lim r5, 3
    adi r6, r7, 6
    cal .bank2_drawGUIRowInGrid

    lim r1, 65
    lim r2, 10
    lim r3, 0
    lim r4, 1
    cal .bank2_drawItem
ret

.bank2_craftingDrawSlotWithoutHighlight
    cal .bank2_inventoryGetSlot
    cmp r6, 0xFF
    brt nequal, ~+2
        ret
    poi r7
    mld r3, 0
    mov r1, r5
    mov r2, r6
    cmp r6, 28
    brt grtreq, ~+4
        cal .bank2_drawItemInGrid
        cal .bank2_clearHighlight
        ret
    lim r4, 1
    cal .bank2_drawItem
ret






.PAGE:
.bank2_loadCraftingGUI
    cal .bank2_drawInventory

    cal .bank2_reset3x3CraftingGrid

    lim r0, 1
    pst r0, %screen_y1
    lim r0, 56
    pst r0, %screen_x1
    lim r0, 0x75
    pst r0, %screen_texid_drawinvtex
    lim r0, 64
    pst r0, %screen_x1
    lim r0, 0x76
    pst r0, %screen_texid_drawinvtex
    lim r0, 72
    pst r0, %screen_x1
    lim r0, 0x77
    pst r0, %screen_texid_drawinvtex

    lim r0, 51
    pst r0, %screen_x1
    lim r0, 11
    pst r0, %screen_y1
    lim r1, GUI_ARROW
    pst r1, %screen_texid_drawinvtex
    lim r0, 59
    pst r0, %screen_x1
    adi r1, r1, 1
    pst r1, %screen_texid_drawinvtex

    lim r0, 0xFF
    mst r0, permanentSelectedSlot

    pld r0, %screen_buffer

.bank2_craftingLoop
    pst r0, %playerinput
    nop
    pld r1, %playerinput
    brt zero, ~+3
        pld r0, %switchbanks
        jmp .continueFromClosingInventory
    jmp .bank2_craftingHandleMovement







.PAGE:
.bank2_craftingHandleMovement
    mld r2, inventorySlot
    pld r1, %playerinput
    brt zero, .bank2_craftingSkipMovement

    mld r7, inventorySlot
    psh r1
    cal .bank2_inventoryDrawSlotWithoutHighlight
    pop r1

    mld r2, inventorySlot
    cmp r2, 0x30
    brt less, .bank2_craftingMoveWithinInventory

        cmp r1, 0x10
        brt nzero, ~+6
            cmp r2, 0x90
            brt less, ~+3
                lim r2, 0x00
                jmp ~+2
            add r2, r2, r1
        cmp r1, 0xF0
        brt nzero, ~+6
            cmp r2, 0x80
            brt grtreq, ~+3
                lim r2, 0x20
                jmp ~+2
            add r2, r2, r1
        cmp r1, 0x0F
        brt nzero, ~+8
            mov r3, r2
            aim r3, 0x0F
            cmp r3, 0x00
            brt nzero, ~+3
                adi r2, r2, 2
                jmp ~+2
            addv r2, r2, r1
        cmp r1, 0x01
        brt nzero, ~+8
            mov r3, r2
            aim r3, 0x0F
            cmp r3, 0x02
            brt nzero, ~+3
                adi r2, r2, -2
                jmp ~+2
            addv r2, r2, r1
        jmp .bank2_craftingSkipMovement

    .bank2_craftingMoveWithinInventory
        cal .bank2_craftingMoveWithinInventory_2
        
    .bank2_craftingSkipMovement
        mst r2, inventorySlot
        mov r7, r2
        cal .bank2_craftingDrawSlotWithHighlight

        pld r1, %playerinput
        brt zero, .bank2_craftingSkipTryCrafting
        mld r1, craftingOutput
        brt zero, .bank2_craftingSkipTryCrafting

        cal .bank2_tryCrafting
        mld r7, inventorySlot
        cal .bank2_craftingDrawSlotWithHighlight
    
    .bank2_craftingSkipTryCrafting
        jmp .bank2_craftingSelection






.PAGE:
.bank2_craftingSelection
    mld r7, permanentSelectedSlot
    cal .bank2_craftingDrawSlotWithHighlight

    pld r1, %playerinput
    brt zero, .bank2_craftingSkipSelectItem

    mld r1, permanentSelectedSlot
    mld r2, inventorySlot
    cmp r1, 0xFF
    brt nzero, .bank2_craftingSelectedAlready
        cmp r2, 0x70
        brt grtreq, .bank2_craftingSkipSelectItem
        mst r2, permanentSelectedSlot
        jmp .bank2_craftingSkipSelectItem
    
    .bank2_craftingSelectedAlready
    mov r7, r1
    cal .bank2_inventoryGetSlot
    poi r7
    mld r3, 0
    mov r7, r2
    cal .bank2_inventoryGetSlot
    poi r7
    mld r4, 0
    poi r7
    mst r3, 0
    psh r4
    mov r7, r2
    cal .bank2_craftingDrawSlotWithHighlight
    pop r4
    mld r1, permanentSelectedSlot
    mld r2, inventorySlot
    cmp r2, 0x50
    brt grtreq, .bank2_craftingCheckCrafting
        
        mov r7, r1
        cal .bank2_inventoryGetSlot
        poi r7
        mst r4, 0
        mov r7, r1
        cal .bank2_craftingDrawSlotWithoutHighlight
        lim r0, 0xFF
        mst r0, permanentSelectedSlot
        mld r7, inventorySlot
        cal .bank2_craftingDrawSlotWithHighlight
        jmp .bank2_craftingSkipSelectItem
    
    .bank2_craftingCheckCrafting
        lim r0, 0xFF
        pst r0, %craftrom
        lim r1, 9
        lim r2, 0
        .bank2_craftingCheckCraftingLoop
            poi r2
            mld r3, craftingGrid
            pst r3, %craftrom
            adi r2, r2, 1
            adi r1, r1, -1
            brt nzero, .bank2_craftingCheckCraftingLoop
        pld r3, %craftrom
        mst r3, craftingOutput
        lim r1, 65
        lim r2, 19
        lim r4, 1
        cal .bank2_drawItem
    
    .bank2_craftingSkipSelectItem
    jmp .bank2_craftingFinishLoop






.PAGE:
.bank2_craftingFinishLoop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop
    pld r0, %playerinput
    nop

    pld r1, %playerinput
    brt zero, .bank2_craftingContinue
        cal .bank2_reset3x3CraftingGrid
        mld r7, inventorySlot
        cal .bank2_craftingDrawSlotWithHighlight

    .bank2_craftingContinue
    pld r0, %screen_buffer
jmp .bank2_craftingLoop





// FURNACE GUI




// CHEST GUI