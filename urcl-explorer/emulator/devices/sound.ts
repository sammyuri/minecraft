import { IO_Port } from "../instructions.js";
import { Device } from "./device.js";

const base_frequency = 92.499;

const ramp_up = 0.005;
const ramp_down = 0.01;

class NoteBlock {
    oscillator: OscillatorNode;
    gain: GainNode;
    constructor(private ctx: AudioContext){
        this.oscillator = this.ctx.createOscillator();
        this.gain = this.ctx.createGain()
        this.gain.gain.value = 0
        this.gain.connect(this.ctx.destination);
        this.oscillator.connect(this.gain);
        this.oscillator.type = "square";
        this.oscillator.start();

    }
    play(note: number, length: number, cb: ()=>void){
        if (this.ctx.state === "suspended"){
            this.ctx.resume();
        }
        this.oscillator.frequency.value = base_frequency * 2 ** (note/12);
        this.gain.gain.setTargetAtTime(0.1, this.ctx.currentTime, ramp_up);
        this.gain.gain.setTargetAtTime(0, this.ctx.currentTime + length*0.001, ramp_down);
        setTimeout(() => {
            cb();
        }, length*0.1+ramp_down);
    }
}

export class Sound implements Device {
    ctx = new AudioContext();
    blocks: NoteBlock[] = [];
    note: number = 0;
    play(note: number, length: number){
        console.log(this.blocks.length, note, length);
        let block = this.blocks.pop();
        if (!block){
            block = new NoteBlock(this.ctx);
        }
        block.play(note, length, () => this.blocks.push(block as NoteBlock));
    }
    constructor(){
    }

    outputs = {
        [IO_Port.NOTE]: (v: number) => {this.note = v;},
        [IO_Port.NLEG]: (v: number) => {this.play(this.note, v);}
    };
}
