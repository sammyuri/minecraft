import { Device } from "../device.js";
import { IO_Port } from "../../instructions.js";
import { running } from "../../../index.js"

export class PlayerInput implements Device {
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
        sprint: false,

        inventory_up: false,
        inventory_down: false,
        inventory_left: false,
        inventory_right: false,
        inventory_open: false,
        inventory_delete: false,
    }
    queue:number[] = []
    outputs = {
        [IO_Port.PLAYERINPUT]: (i:number) => {
            this.queue = []
        }
    }
    inputs = {
        [IO_Port.PLAYERINPUT]: () => {
            if (this.queue.length == 0) {
                let output = 0;
                this.queue.push(this.keys.inventory_open ? 1 : 0); //open/close inventory pressed?
                output = 0;
                if (this.keys.inventory_up) {
                    output = 1 << 4;
                } else if (this.keys.inventory_down) {
                    output = (-1 & 0x0F) << 4;
                }
                if (this.keys.inventory_right) {
                    output |= 1;
                } else if (this.keys.inventory_left) {
                    output |= (-1 & 0x0F);
                }
                this.queue.push(output); //inventory movement

                this.queue.push(this.keys.break ? 1 : 0); //break pressed?
                this.queue.push(this.keys.use ? 1 : 0); //use/place pressed?
                this.queue.push(this.keys.crouch ? 1 : 0); //crouch pressed?

                output = 0;
                if (this.keys.look_up) {
                    output = 1 << 4;
                } else if (this.keys.look_down) {
                    output = (-1 & 0x0F) << 4;
                }
                if (this.keys.look_left) {
                    output |= 1;
                } else if (this.keys.look_right) {
                    output |= (-1 & 0x0F);
                }
                this.queue.push(output); //rotation
                
                let speed = this.keys.crouch ? 4 : 8;
                if (this.keys.move_forward) { //forward movement
                    this.queue.push(speed + (this.keys.sprint && !this.keys.crouch ? 4 : 0));
                } else if (this.keys.move_backward) {
                    this.queue.push(-speed & 0xFF);
                } else {
                    this.queue.push(0);
                }

                if (this.keys.move_left) { //strafe movement
                    this.queue.push(-speed & 0xFF);
                } else if (this.keys.move_right) {
                    this.queue.push(speed);
                } else {
                    this.queue.push(0);
                }

                this.queue.push(this.keys.jump ? 1 : 0); //jump pressed?
                
                this.queue.push(this.keys.inventory_delete ? 1 : 0); //delete item pressed?

                return 0;
            } else {
                return this.queue.shift();
            }
        }
    }
    constructor() {
        addEventListener("keydown", (e:KeyboardEvent) => {
            if (running) {
                e.preventDefault();
            }
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
                case "ArrowDown":
                    this.keys.inventory_down = true;
                    break;
                case "ArrowUp":
                    this.keys.inventory_up = true;
                    break;
                case "ArrowLeft":
                    this.keys.inventory_left = true;
                    break;
                case "ArrowRight":
                    this.keys.inventory_right = true;
                    break;
                case "e":
                    this.keys.inventory_open = true;
                    break;
                case "q":
                    this.keys.inventory_delete = true;
                    break;
            }
        });
        addEventListener("keyup", (e:KeyboardEvent) => {
            if (running) {
                e.preventDefault();
            }
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
                case "ArrowDown":
                    this.keys.inventory_down = false;
                    break;
                case "ArrowUp":
                    this.keys.inventory_up = false;
                    break;
                case "ArrowLeft":
                    this.keys.inventory_left = false;
                    break;
                case "ArrowRight":
                    this.keys.inventory_right = false;
                    break;
                case "e":
                    this.keys.inventory_open = false;
                    break;
                case "q":
                    this.keys.inventory_delete = false;
                    break;
            }
        });
    }
}