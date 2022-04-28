cal .renderFullMesh
pst r0, 69

cal .runGame

; cal .renderFullMesh
; lim r1, -20

; .mainloop
; pst r1, 72
; psh r1
; pst r0, 68
; cal .renderFullMesh
; pst r0, 69
; pop r1
; adi r1, r1, 4
; cmp r1, 20
; brt nzero, .mainloop

; lim r1, 15

; .mainloop2
; pst r1, 66
; psh r1
; pst r0, 68
; cal .renderFullMesh
; pst r0, 69
; pop r1
; adi r1, r1, -1
; cmp r1, -1
; brt nzero, .mainloop2

; lim r1, 15

; .mainloop3
; pst r1, 67
; psh r1
; pst r0, 68
; cal .renderFullMesh
; pst r0, 69
; pop r1
; adi r1, r1, -1
; cmp r1, -1
; brt nzero, .mainloop3



hlt

