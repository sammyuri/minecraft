import { IO_Port } from "../../instructions.js";
export class PlayerInput {
    constructor() {
        this.keys = {
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
        };
        this.queue = [];
        this.outputs = {
            [IO_Port.PLAYERINPUT]: (i) => {
                this.queue = [];
            }
        };
        this.inputs = {
            [IO_Port.PLAYERINPUT]: () => {
                if (this.queue.length == 0) {
                    let output = 0;
                    this.queue.push(0); //TODO: open/close inventory pressed
                    this.queue.push(0); //TODO: inventory movement
                    this.queue.push(this.keys.break ? 1 : 0);
                    this.queue.push(this.keys.use ? 1 : 0);
                    this.queue.push(this.keys.crouch ? 1 : 0);
                    output = 0;
                    if (this.keys.look_up) {
                        output = 1 << 4;
                    }
                    else if (this.keys.look_down) {
                        output = (-1 & 0x0F) << 4;
                    }
                    else {
                        output = 0 << 4;
                    }
                    if (this.keys.look_left) {
                        output |= 1;
                    }
                    else if (this.keys.look_right) {
                        output |= (-1 && 0x0F);
                    }
                    else {
                        output |= 0;
                    }
                    this.queue.push(output);
                    let speed = this.keys.crouch ? 4 : 8;
                    if (this.keys.move_forward) {
                        this.queue.push(speed + (this.keys.sprint && !this.keys.crouch ? 4 : 0));
                    }
                    else if (this.keys.move_backward) {
                        this.queue.push(-speed & 0xFF);
                    }
                    else {
                        this.queue.push(0);
                    }
                    if (this.keys.move_left) {
                        this.queue.push(-speed & 0xFF);
                    }
                    else if (this.keys.move_right) {
                        this.queue.push(speed);
                    }
                    else {
                        this.queue.push(0);
                    }
                    this.queue.push(this.keys.jump ? 1 : 0);
                    this.queue.push(0); //TODO: drop item pressed
                    return 0;
                }
                else {
                    return this.queue.shift();
                }
            }
        };
        addEventListener("keydown", (e) => {
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
        addEventListener("keyup", (e) => {
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