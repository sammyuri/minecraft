import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";

export class PlayerInput implements Device {
    inputs = {
        [IO_Port.PI1]: () => { //returns PPP_YYY_BU
            let output = 0;
            if (this.keys.look_up) {
                output = 5 << 5; //1+4 = 5
            } else if (this.keys.look_down) {
                output = 3 << 5; //-1+4 = 3
            } else {
                output = 4 << 5;
            }
            if (this.keys.look_left) {
                output |= 5 << 2; //1+4 = 5
            } else if (this.keys.look_right) {
                output |= 3 << 2; //-1+4 = 3
            } else {
                output |= 4 << 2;
            }
            if (this.keys.break) {
                output |= 1 << 1;
            }
            if (this.keys.use) {
                output |= 1;
            }
            return output;
        },
        [IO_Port.PI2]: () => { //returns FFF_SSS_CJ
            let output = 0;
            let speed = this.keys.crouch ? 1 : 2;
            if (this.keys.move_forward) {
                output = (speed + 4 + (this.keys.sprint ? 1 : 0)) << 5;
            } else if (this.keys.move_backward) {
                output = (-speed + 4) << 5;
            } else {
                output = 4 << 5;
            }
            if (this.keys.move_left) {
                output |= (-speed + 4) << 2;
            } else if (this.keys.move_right) {
                output |= (speed + 4) << 2;
            } else {
                output |= 4 << 2;
            }
            if (this.keys.crouch) {
                output |= 1 << 1;
            }
            if (this.keys.jump) {
                output |= 1;
            }
            return output;
        }
    }
    keys = {
        look_up: false,
        look_down: false,
        look_left: false,
        look_right: false,
        break: false,
        use: false,

        move_forward: false,
        move_backward: false,
        move_left: false,
        move_right: false,
        jump: false,
        crouch: false,
        sprint: false
    }
    constructor() {
        addEventListener("keydown", (e:KeyboardEvent) => {
            switch (e.key) {
                case "Control":
                    this.keys.sprint = true;
                    break;
                case "Shift":
                    this.keys.crouch = true;
                    break;
                case " ":
                    this.keys.jump = true;
                    break;
                case "w":
                    this.keys.move_forward = true;
                    break;
                case "a":
                    this.keys.move_left = true;
                    break;
                case "s":
                    this.keys.move_backward = true;
                    break;
                case "d":
                    this.keys.move_right = true;
                    break;
                case "i":
                    this.keys.look_up = true;
                    break;
                case "j":
                    this.keys.look_left = true;
                    break;
                case "k":
                    this.keys.look_down = true;
                    break;
                case "l":
                    this.keys.look_right = true;
                    break;
                case "n":
                    this.keys.break = true;
                    break;
                case "m":
                    this.keys.use = true;
                    break;
            }
        });
        addEventListener("keyup", (e:KeyboardEvent) => {
            switch (e.key) {
                case "Control":
                    this.keys.sprint = false;
                    break;
                case "Shift":
                    this.keys.crouch = false;
                    break;
                case " ":
                    this.keys.jump = false;
                    break;
                case "w":
                    this.keys.move_forward = false;
                    break;
                case "a":
                    this.keys.move_left = false;
                    break;
                case "s":
                    this.keys.move_backward = false;
                    break;
                case "d":
                    this.keys.move_right = false;
                    break;
                case "i":
                    this.keys.look_up = false;
                    break;
                case "j":
                    this.keys.look_left = false;
                    break;
                case "k":
                    this.keys.look_down = false;
                    break;
                case "l":
                    this.keys.look_right = false;
                    break;
                case "n":
                    this.keys.break = false;
                    break;
                case "m":
                    this.keys.use = false;
                    break;
            }
        });
    }
}