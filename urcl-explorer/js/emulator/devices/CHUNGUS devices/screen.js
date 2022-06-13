import { IO_Port } from "../../instructions.js";
import { Textures, SCREEN_HEIGHT, SCREEN_WIDTH } from "./amogus.js";
export class Screen {
    constructor(display) {
        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 0;
        this.y2 = 0;
        this.texId = 0;
        this.buffer = [];
        this.outputs = {
            [IO_Port.SCREEN_X1]: (i) => {
                this.x1 = i;
            },
            [IO_Port.SCREEN_Y1]: (i) => {
                this.y1 = i;
            },
            [IO_Port.SCREEN_X2]: (i) => {
                this.x2 = i;
            },
            [IO_Port.SCREEN_Y2]: (i) => {
                this.y2 = i;
            },
            [IO_Port.SCREEN_X1_DRAWRECT]: (i) => {
                this.x1 = i;
                this.DrawRect(1);
            },
            [IO_Port.SCREEN_Y1_DRAWRECT]: (i) => {
                this.y1 = i;
                this.DrawRect(1);
            },
            [IO_Port.SCREEN_X2_DRAWRECT]: (i) => {
                this.x2 = i;
                this.DrawRect(1);
            },
            [IO_Port.SCREEN_Y2_DRAWRECT]: (i) => {
                this.y2 = i;
                this.DrawRect(1);
            },
            [IO_Port.SCREEN_X1_CLEARRECT]: (i) => {
                this.x1 = i;
                this.DrawRect(0);
            },
            [IO_Port.SCREEN_Y1_CLEARRECT]: (i) => {
                this.y1 = i;
                this.DrawRect(0);
            },
            [IO_Port.SCREEN_X2_CLEARRECT]: (i) => {
                this.x2 = i;
                this.DrawRect(0);
            },
            [IO_Port.SCREEN_Y2_CLEARRECT]: (i) => {
                this.y2 = i;
                this.DrawRect(0);
            },
            [IO_Port.SCREEN_X1_DRAWTEX]: (i) => {
                this.x1 = i;
                this.DrawTex(1);
            },
            [IO_Port.SCREEN_Y1_DRAWTEX]: (i) => {
                this.y1 = i;
                this.DrawTex(1);
            },
            [IO_Port.SCREEN_X1_DRAWINVTEX]: (i) => {
                this.x1 = i;
                this.DrawTex(0);
            },
            [IO_Port.SCREEN_Y1_DRAWINVTEX]: (i) => {
                this.y1 = i;
                this.DrawTex(0);
            },
            [IO_Port.SCREEN_TEXID]: (i) => {
                this.texId = i;
            },
            [IO_Port.SCREEN_TEXID_DRAWTEX]: (i) => {
                this.texId = i;
                this.DrawTex(1);
            },
            [IO_Port.SCREEN_TEXID_DRAWINVTEX]: (i) => {
                this.texId = i;
                this.DrawTex(0);
            }
        };
        this.inputs = {
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
        };
        this.display = display;
        this.ClearScreen();
    }
    DrawRect(color) {
        for (let y = this.y1; y < this.y2 + 1; y++) { //TODO: x2/y2 are currently inclusive, but that could change
            for (let x = this.x1; x < this.x2 + 1; x++) {
                this.buffer[y][x] = color;
            }
        }
    }
    DrawTex(color) {
        let texture = Textures[this.texId];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                this.buffer[y + this.y1][x + this.x1] = texture[y * 8 + x] ^ color;
            }
        }
    }
    ClearScreen() {
        this.buffer = [];
        for (let y = 0; y < SCREEN_HEIGHT; y++) {
            this.buffer[y] = [];
            for (let x = 0; x < SCREEN_WIDTH; x++) {
                this.buffer[y][x] = 0;
            }
        }
    }
    DrawToDisplay() {
        for (let y = 0; y < SCREEN_HEIGHT; y++) {
            this.display.y_out(y);
            for (let x = 0; x < SCREEN_WIDTH; x++) {
                this.display.x_out(x);
                this.display.color_out(this.buffer[y][x]);
            }
        }
        this.display.update_display();
        // this.display.clear();
    }
}