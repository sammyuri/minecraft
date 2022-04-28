.PAGE

.runGame
    lim r0, 38  ; store starting values for player
    mst r0, playerx
    lim r0, 27
    mst r0, playery
    lim r0, 12
    mst r0, playerz
    mst r0, camx
    mst r0, camy

    .gameLoop
        pld r1, 64
        pst r0, 68
        cmp r1, 5  ; move
        brt grtreq, .skipMove
            mld r2, camx  ; get direction data
            bsli r1, r1, 2
            add r2, r2, r1
            aim r2, 15
            poi r2
            pld r1, %direction

            mld r2, playerx
            sxtsri r3, r1, 4
            add r3, r3, r2
            mst r3, playerx
            pst r3, %camx
            
            mld r2, playerz
            bsli r3, r1, 4
            sxtsri r3, r3, 4
            add r3, r3, r2
            mst r3, playerz
            pst r3, %camz

        .skipMove
        cmp r1, 5
        brt nequal, .skipTurnUp
            mld r1, camy
            adi r1, r1, 1
            aim r1, 15
            mst r1, camy
            pst r1, %yrotation
        .skipTurnUp
        cmp r1, 6
        brt nequal, .skipTurnDown
            mld r1, camy
            adi r1, r1, -1
            aim r1, 15
            mst r1, camy
            pst r1, %yrotation
        .skipTurnDown
        cmp r1, 7
        brt nequal, .skipTurnLeft
            mld r1, camx
            adi r1, r1, 1
            aim r1, 15
            mst r1, camx
            pst r1, %xrotation
        .skipTurnLeft
        cmp r1, 8
        brt nequal, .skipTurnRight
            mld r1, camx
            adi r1, r1, -1
            aim r1, 15
            mst r1, camx
            pst r1, %xrotation
        .skipTurnRight

        cal .renderFullMesh
        pst r0, 69
        jmp .gameLoop


ret