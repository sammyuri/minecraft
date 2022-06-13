import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";
import { Texture, Textures, SCREEN_HEIGHT, SCREEN_WIDTH } from "./amogus.js";
import { Gl_Display } from "../gl-display";

export class Screen implements Device {
    x1:number = 0;
    y1:number = 0;
    x2:number = 0;
    y2:number = 0;
    texId:Texture = 0;

    display:Gl_Display;

    buffer:number[][] = [];

    constructor(display:Gl_Display) {
        this.display = display;
        this.ClearScreen();
    }

    outputs = {
        [IO_Port.SCREEN_X1]: (i:number) => {
            this.x1 = i;
        },
        [IO_Port.SCREEN_Y1]: (i:number) => {
            this.y1 = i;
        },
        [IO_Port.SCREEN_X2]: (i:number) => {
            this.x2 = i;
        },
        [IO_Port.SCREEN_Y2]: (i:number) => {
            this.y2 = i;
        },
        [IO_Port.SCREEN_X1_DRAWRECT]: (i:number) => {
            this.x1 = i;
            this.DrawRect(1);
        },
        [IO_Port.SCREEN_Y1_DRAWRECT]: (i:number) => {
            this.y1 = i;
            this.DrawRect(1);
        },
        [IO_Port.SCREEN_X2_DRAWRECT]: (i:number) => {
            this.x2 = i;
            this.DrawRect(1);
        },
        [IO_Port.SCREEN_Y2_DRAWRECT]: (i:number) => {
            this.y2 = i;
            this.DrawRect(1);
        },
        [IO_Port.SCREEN_X1_CLEARRECT]: (i:number) => {
            this.x1 = i;
            this.DrawRect(0);
        },
        [IO_Port.SCREEN_Y1_CLEARRECT]: (i:number) => {
            this.y1 = i;
            this.DrawRect(0);
        },
        [IO_Port.SCREEN_X2_CLEARRECT]: (i:number) => {
            this.x2 = i;
            this.DrawRect(0);
        },
        [IO_Port.SCREEN_Y2_CLEARRECT]: (i:number) => {
            this.y2 = i;
            this.DrawRect(0);
        },
        [IO_Port.SCREEN_X1_DRAWTEX]: (i:number) => {
            this.x1 = i;
            this.DrawTex(1);
        },
        [IO_Port.SCREEN_Y1_DRAWTEX]: (i:number) => {
            this.y1 = i;
            this.DrawTex(1);
        },
        [IO_Port.SCREEN_X1_DRAWINVTEX]: (i:number) => {
            this.x1 = i;
            this.DrawTex(0);
        },
        [IO_Port.SCREEN_Y1_DRAWINVTEX]: (i:number) => {
            this.y1 = i;
            this.DrawTex(0);
        },
        [IO_Port.SCREEN_TEXID]: (i:number) => {
            this.texId = i;
        },
        [IO_Port.SCREEN_TEXID_DRAWTEX]: (i:number) => {
            this.texId = i;
            this.DrawTex(1);
        },
        [IO_Port.SCREEN_TEXID_DRAWINVTEX]: (i:number) => {
            this.texId = i;
            this.DrawTex(0);
        }
    }
    inputs = {
        [IO_Port.SCREEN_NOP]: () => {
            return 0;
        },
        [IO_Port.SCREEN_DRAWRECT]: () => {
            this.DrawRect(1);
            return 0;
        },
        [IO_Port.SCREEN_CLEARRECT]: () => {
            this.DrawRect(0);
            return 0;
        },
        [IO_Port.SCREEN_DRAWTEX]: () => {
            this.DrawTex(1);
            return 0;
        },
        [IO_Port.SCREEN_DRAWINVTEX]: () => {
            this.DrawTex(0);
            return 0;
        },
        [IO_Port.SCREEN_CLEARSCREEN]: () => {
            this.ClearScreen();
            return 0;
        },
        [IO_Port.SCREEN_BUFFER]: () => {
            this.DrawToDisplay();
            return 0;
        }
    }

    DrawRect(color:number) {
        for (let y = this.y1; y < this.y2 + 1; y++) { //TODO: x2/y2 are currently inclusive, but that could change
            for (let x = this.x1; x < this.x2 + 1; x++) {
                this.buffer[y][x] = color;
            }
        }
    }

    DrawTex(color:number) {
        let texture = Textures[this.texId];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                this.buffer[y + this.y1][x + this.x1] = texture[y * 8 + x] ^ color;
            }
        }
    }

    ClearScreen() {
        this.buffer = [];
        for(let y = 0; y < SCREEN_HEIGHT; y++) {
            this.buffer[y] = [];
            for(let x = 0; x < SCREEN_WIDTH; x++) {
                this.buffer[y][x] = 0;
            }
        }
    }

    DrawToDisplay() {
        for (let y = 0; y < SCREEN_HEIGHT; y++) {
            this.display.y_out(y)
            for (let x = 0; x < SCREEN_WIDTH; x++) {
                this.display.x_out(x);
                this.display.color_out(this.buffer[y][x]);
            }
        }
        this.display.update_display();
        // this.display.clear();
    }
}