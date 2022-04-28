; registers
@DEFINE x r1
@DEFINE y r2
@DEFINE z r3



.PAGE

.blockToMesh
    cal .getBlock
    adi r5, r4, 0
    brt nzero, .notAir  ; check if block is air
        cmp y, 0  ; if block isn't at bottom of world, do nothing.
        brt nzero, .skipBlock
            lim y, -1
            lim r4, %posYFace




        
            ; cal .makeFaceTris





        .skipBlock
        ret
    .notAir

    cmp x, 0
    brt zero, .endNegX  ; if x is 0, don't draw west face
        adi x, x, -1  ; check x - 1
        cal .getBlock
        adi x, x, 1
        cmp r4, 0
        brt nzero, .endNegX  ; if block at x-1 is not air, don't make triangles on this face
            lim r4, %negXFace  ; side face, so no special texture handling needed
            cal .makeFaceTris
    .endNegX

    cmp x, 7
    brt zero, .endPosX  ; if x is 7, don't draw east face
        adi x, x, 1  ; check x + 1
        cal .getBlock
        adi x, x, -1
        cmp r4, 0
        brt nzero, .endPosX  ; if block at x+1 is not air, don't make triangles on this face
            lim r4, %posXFace  ; side face, so no special texture handling needed
            cal .makeFaceTris
    .endPosX

    cmp z, 0
    brt zero, .endNegZ  ; if z is 0, don't draw south face
        adi z, z, -1  ; check z - 1
        cal .getBlock
        adi z, z, 1
        cmp r4, 0
        brt nzero, .endNegZ  ; if block at z-1 is not air, don't make triangles on this face
            lim r4, %negZFace  ; side face, so no special texture handling needed
            cal .makeFaceTris
    .endNegZ

    jmp .blockToMesh_2


.getBlock
psh r5
psh r6

    bsli r4, r2, 3  ; get row
    add r4, r4, r3

    poi r4  ; get bottom bit
    mld r5, 128
    rot r5, r5, r1
    aim r5, 1

    add r4, r4, r4  ; get other two bits
    bsri r6, r1, 2
    add r4, r4, r6
    poi r4
    mld r4, 0
    bsli r1, r1, 1  ; shift to right spot
    rot r4, r4, r1
    add r4, r4, r4
    bsri r1, r1, 1
    aim r4, 6
    add r4, r4, r5

pop r6
pop r5
ret



.PAGE

.blockToMesh_2
    cmp z, 7
    brt zero, .endPosZ  ; if x is 7, don't draw east face
        adi z, z, 1  ; check z + 1
        cal .getBlock
        adi z, z, -1
        cmp r4, 0
        brt nzero, .endPosZ  ; if block at z+1 is not air, don't make triangles on this face
            lim r4, %posZFace  ; side face, so no special texture handling needed
            cal .makeFaceTris
    .endPosZ

    cmp y, 0
    brt zero, .endNegY  ; if y is 0, don't draw bottom face
        adi y, y, -1  ; check y - 1
        cal .getBlock
        adi y, y, 1
        cmp r4, 0
        brt nzero, .endNegY  ; if block at y-1 is not air, don't make triangles on this face
            lim r4, %negYFace
            psh r5  ; bottom face, check for special texture handling
                cmp r5, grassBlock
                brt nzero, .negY_skipGrass
                    lim r5, dirtTexture
                    jmp .skipBottomTex

                .negY_skipGrass
                cmp r5, logBlock
                brt nzero, .negY_skipLog
                    lim r5, logTopTexture
                    jmp .skipBottomTex

                .negY_skipLog
                cmp r5, craftingBlock
                brt nzero, .skipBottomTex
                    lim r5, plankTexture

                .skipBottomTex
                cal .makeFaceTris
            pop r5
    .endNegY

    cmp y, 7
    brt zero, .skipTopFaceCheck  ; if y is 7, don't check y+1, but still draw top face
        adi y, y, 1
        cal .getBlock
        adi y, y, -1
        cmp r4, 0
        brt nzero, .endPosY  ; if block at y+1 is not air, don't make triangles on this face
            .skipTopFaceCheck
            lim r4, %posYFace
            psh r5  ; top face, check for special texture handling
                cmp r5, grassBlock
                brt nzero, .posY_skipGrass
                    lim r5, grassTopTexture
                    jmp .skipTopTex

                .posY_skipGrass
                cmp r5, logBlock
                brt nzero, .posY_skipLog
                    lim r5, logTopTexture
                    jmp .skipTopTex

                .posY_skipLog
                cmp r5, craftingBlock
                brt nzero, .skipTopTex
                    lim r5, craftingTopTexture

                .skipTopTex
                cal .makeFaceTris
            pop r5
    .endPosY
ret


.PAGE

.renderFullMesh
    lim y, 0
    .renderFullMesh_yLoop
        lim z, 0
        .renderFullMesh_zLoop
            lim x, 0
            .renderFullMesh_xLoop
                psh y
                cal .blockToMesh
                pop y
                adi x, x, 1
                cmp x, 8
                brt nzero, .renderFullMesh_xLoop
            adi z, z, 1
            cmp z, 8
            brt nzero, .renderFullMesh_zLoop
        adi y, y, 1
        cmp y, 8
        brt nzero, .renderFullMesh_yLoop
ret


.makeFaceTris
    pst r5, %texture

    loopsrc .makeTriLoopEnd
    loopcnt 5
    .makeTriLoop
        poi r4
        pld r7, 0

        mov r6, r7
        aim r6, 1
        add r6, r6, x
        pst r6, %vertex

        bsri r6, r7, 1
        aim r6, 1
        add r6, r6, y
        pst r6, %vertex

        bsri r6, r7, 2
        aim r6, 1
        add r6, r6, z
        pst r6, %vertex

        bsri r6, r7, 3
        aim r6, 1
        pst r6, %vertex

        bsri r6, r7, 4
        aim r6, 1
        pst r6, %vertex

        .makeTriLoopEnd
        adi r4, r4, 1
    
    adi r4, r4, -6

ret
