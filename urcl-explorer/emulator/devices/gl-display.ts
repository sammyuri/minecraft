import { createProgram } from "../../webgl/shader.js";
import { IO_Port } from "../instructions.js";
import { Device } from "./device.js";
import { Color_Mode, pico8 } from "./display.js";

export class Gl_Display implements Device {
    private gl: WebGL2RenderingContext;
    private gl_vertices: WebGLBuffer;
    private gl_indices: WebGLBuffer;
    private gl_texture: WebGLTexture;
    private uni_mode: WebGLUniformLocation;
    // private gl_program: WebGLProgram;
    private buffer: Uint32Array;
    private bytes: Uint8Array;
    private buffer_enabled: 1 | 0 = 0;
    private x = 0;
    private y = 0;
    private pref_display?: HTMLElement | null = globalThis?.document?.getElementById?.("pref-display");
    bits = 8;

    private vert_src = /*vert*/ `#version 300 es
    precision mediump float;
    in vec2 a_uv;
    in vec2 a_pos;

    out vec2 v_uv;

    void main(){
        gl_Position = vec4(a_pos, 0., 1.);
        v_uv = a_uv;
    }
    `;
    private frag_src = /*frag*/`#version 300 es
    precision mediump float;
    in vec2 v_uv;
    out vec4 color;

    uniform sampler2D u_image;
    uniform uint u_color_mode;

    vec4 rgb(vec4 v, uint bits){
        uint color = uint(v.x * 255.) + (uint(v.y * 255.) << 8u) + (uint(v.z * 255.) << 16u);
        uint blue_bits = bits / 3u;
        uint blue_mask = (1u << blue_bits) - 1u;
        uint red_bits = (bits - blue_bits) / 2u;
        uint red_mask = (1u << red_bits) - 1u;
        uint green_bits = bits - blue_bits - red_bits;
        uint green_mask = (1u << green_bits) - 1u;
        
        uint green_offset = blue_bits;
        uint red_offset = green_offset + green_bits;
        return vec4(
            float((color >> red_offset   ) & red_mask) / float(red_mask),
            float((color >> green_offset ) & green_mask) / float(green_mask),
            float((color                  ) & blue_mask) / float(blue_mask),
            1
        );
    }
    vec4 rgbi(vec4 v){
        uint c = uint(v.x * 255.);
        uint r = (c >> 3u) & 1u;
        uint g = (c >> 2u) & 1u;
        uint b = (c >> 1u) & 1u;
        uint i = ((c >> 0u) & 1u) + 1u;
        if ((c & 15u) == 1u){
            return vec4(0.25, 0.25, 0.25, 1.);
        }
        return vec4(float(r*i)/2.1, float(g*i)/2.1, float(b*i)/2.1, 1.);
    }
    vec4 pallet_pico8[16] = vec4[16](
        ${pico8.map(v => `vec4(${v.map(n=>(n/255))},1.)`).join(",")}
    );

    vec4 pico8(vec4 v){
        return pallet_pico8[uint(v.x * 255.) & 15u];
    }

    vec4 mono(vec4 c){
        return vec4(c.x, c.x, c.x, 1);
    }

    vec4 bin(vec4 c){
        return c.x > 0. || c.y > 0. || c.z > 0. ? vec4(1,1,1,1) : vec4(0,0,0,1);
    }


    void main(){
        vec4 c = texture(u_image, v_uv);
        switch (u_color_mode){
            case ${Color_Mode.Bin}u: color = bin(c); break;
            case ${Color_Mode.Mono}u: color = mono(c); break;
            case ${Color_Mode.PICO8}u: color = pico8(c); break;
            case ${Color_Mode.RGB}u: color = rgb(c, 8u); break;
            case ${Color_Mode.RGB6}u: color = rgb(c, 6u); break;
            case ${Color_Mode.RGB8}u: color = rgb(c, 8u); break;
            case ${Color_Mode.RGB12}u: color = rgb(c, 12u); break;
            case ${Color_Mode.RGB16}u: color = rgb(c, 16u); break;
            case ${Color_Mode.RGB24}u: color = rgb(c, 24u); break;
            case ${Color_Mode.RGBI}u: color = rgbi(c); break;
            default: color = rgbi(c); break;
        }
    }
    
    `;

    inputs = {
        [IO_Port.COLOR]: this.color_in,
        [IO_Port.X]: this.x_in,
        [IO_Port.Y]: this.y_in,
        [IO_Port.BUFFER]: this.buffer_in,
    }
    outputs = {
        [IO_Port.COLOR]: this.color_out,
        [IO_Port.X]: this.x_out,
        [IO_Port.Y]: this.y_out,
        [IO_Port.BUFFER]: this.buffer_out,
    }
    reset(){
        this.x = 0;
        this.y = 0;
        this.clear();
        this.buffer_enabled = 0;
    }
    
    constructor (
        gl: WebGL2RenderingContext,
        public color_mode = Color_Mode.RGBI
    ){
        this.gl = gl;
        const {drawingBufferWidth: width, drawingBufferHeight: height} = gl;
        this.buffer = new Uint32Array(width * height);
        this.bytes = new Uint8Array(this.buffer.buffer, 0, this.buffer.byteLength);

        const gl_program = createProgram(gl, this.vert_src, this.frag_src);
        gl.useProgram(gl_program);
        const attr_pos = gl.getAttribLocation(gl_program, 'a_pos');
        if (attr_pos < 0){
            throw new Error("program does not have attribute a_pos");
        }
        const attr_uv = gl.getAttribLocation(gl_program, 'a_uv');
        if (attr_uv < 0){
            throw new Error("program does not have attribute a_uv");
        }
        const uni_image = gl.getUniformLocation(gl_program, "u_image");
        if (uni_image === null){
            throw new Error("program does not have uniform u_image");
        }
        const uni_mode = gl.getUniformLocation(gl_program, "u_color_mode");
        if (uni_mode === null){
            throw new Error("program does not have uniform u_color_mode");
        }
        this.uni_mode = uni_mode;

        gl.enableVertexAttribArray(attr_pos);
        gl.enableVertexAttribArray(attr_uv);

        
        const gl_vertices = gl.createBuffer();
        if (gl_vertices === null){
            throw new Error("unable to create webgl buffer");
        }
        this.gl_vertices = gl_vertices;
        
        const gl_indices = gl.createBuffer();
        if (gl_indices === null){
            throw new Error("unable to create webgl buffer");
        }
        this.gl_indices = gl_indices;

        const gl_texture = gl.createTexture();
        if (gl_texture === null){
            throw new Error("unable to create webgl texture");
        }
        this.gl_texture = gl_texture;
        gl.bindTexture(gl.TEXTURE_2D, gl_texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


        gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_indices);

        gl.vertexAttribPointer(attr_pos, 2, gl.FLOAT, false, 4*4, 0);
        gl.vertexAttribPointer(attr_uv, 2, gl.FLOAT, false, 4*4, 4*2);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 2, 1, 0, 2, 3]), gl.STATIC_DRAW);
        this.init_buffers(width, height);


        this.gl.canvas.onclick = () => {
            this.gl.canvas.requestFullscreen();
        }
    }
    resize(width: number, height: number){
        const buffer = new Uint32Array(width * height);
        const mw = Math.min(this.width, width), mh = Math.min(this.height, height);
        for (let y = 0; y < mh; y++){
            for (let x = 0; x < mw; x++){
                const from = x + y * this.width;
                const to = x + y * width;
                buffer[to] = this.buffer[from];
            }
        }

        this.buffer = buffer;
        this.bytes = new Uint8Array(buffer.buffer, 0, buffer.byteLength);
        this.width = width; this.height = height;
        this.init_buffers(width, height);
        this.update_display();
    }
    clear() {
        this.buffer.fill(0);
    }
    x_in(){
        return this.width;
    }
    y_in(){
        return this.height;
    }

    x_out(value: number){
        this.x = value;
    }
    y_out(value: number){
        this.y = value;
    }
    color_in(){
        if (!this.in_bounds(this.x, this.y)){
            return 0;
        }
        return this.buffer[this.x + this.y * this.width];
    }
    // rrrgggbb
    // rrrrrggggggbbbbb
    // rrrrrrrrggggggggbbbbbbbb
    color_out(color: number){
        if (!this.in_bounds(this.x, this.y)){
            return;
        }
        this.buffer[this.x + this.y * this.width] = color;
        if (!this.buffer_enabled){
            this.dirty_display();
        }
    }
    buffer_in(): number {
        return this.buffer_enabled;
    }
    start_t = 0;
    buffer_out(value: number){
        switch (value){
            case 0: {
                this.update_display();
                this.clear();
                this.buffer_enabled = 0;
            } break;
            case 1: {
                this.start_t = performance.now();
                this.buffer_enabled = 1;
            } break;
            case 2: {
                this.update_display();
                if (this.pref_display){
                    const end_t = performance.now();
                    const dt = end_t - this.start_t;
                    this.pref_display.innerText = `frame time: ${dt.toFixed(1)}ms`;
                }
                this.start_t = performance.now();
            } break;
        }
    }

    private init_buffers(width: number, height: number){
        const {gl} = this;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,       0, 1,
             1, -1,       1, 1,
             1,  1,       1, 0,
            -1,  1,       0, 0,
        ]), gl.STATIC_DRAW);
        gl.viewport(0, 0, width, height);
    }

    private dirty_display(){
        this.update_display();
    }

    update_display(){
        let {gl, width, height, bytes, uni_mode, color_mode, bits} = this;
        if (color_mode === Color_Mode.RGB){
            if (this.bits >= 24){
                color_mode = Color_Mode.RGB24;
            } else if (this.bits >= 16){
                color_mode = Color_Mode.RGB16;
            } else {
                color_mode = Color_Mode.RGB8;
            }
        }
        gl.uniform1ui(uni_mode, color_mode)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    private in_bounds(x: number, y: number){
        return x >= 0 && x < this.width
            && y >= 0 && y < this.height;
    }

    get width(){
        return this.gl.canvas.width;
    }
    private set width(value: number){
        this.gl.canvas.width = value;
    }
    get height(){
        return this.gl.canvas.height;
    }
    private set height(value: number){
        this.gl.canvas.height = value;
    }
}
