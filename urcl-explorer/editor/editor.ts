import { pad_left } from "../emulator/util.js";
import { regex_end, Token, tokenize } from "./tokenizer.js";

export class Editor_Window extends HTMLElement {
    private line_nrs = document.createElement("div")
    private code = document.createElement("div");
    private input = document.createElement("textarea");
    private colors = document.createElement("pre");
    private profile_check = document.createElement("input");
    private profiled: boolean[] = [];
    private profile_present: boolean = false;
    private old_lines: string[] = [];
    tab_width = 4
    constructor(){
        super();
        this.append(this.line_nrs, this.code);
        this.code.append(this.input, this.colors);

        this.code.style.position = "relative";
        this.code.className = "code";
        this.colors.className = "colors";
        this.line_nrs.className = "line-nrs";
        this.input.addEventListener("input", this.input_cb.bind(this));
        this.input.spellcheck = false;

        this.input.addEventListener("keydown", this.keydown_cb.bind(this));
        this.profile_check.type = "checkbox";
        const profile_text = document.createElement("span");
        this.parentElement?.insertBefore(this.profile_check, this);
        profile_text.textContent = `Show line-profile`;
        this.parentElement?.insertBefore(profile_text, this);
    }
    get value(){
        return this.input.value;
    }
    set value(value){
        this.input.value = value;
        this.input_cb()
    }
    private pc_line = 0;
    public set_pc_line(line: number){
        const old = this.line_nrs.children[this.pc_line];
        if (old){
            old.classList.remove("pc-line");
        }

        const child = this.line_nrs.children[line];
        if (child){
            child.classList.add("pc-line");
        }
        this.pc_line = line;
    }
    public set_line_profile(counts: [number, number][]){
        if (!this.profile_check.checked){
            if (!this.profile_present){
                return;
            }
            this.profile_present = false;
        } 
        const children = this.line_nrs.children;
        let last = 0;
        for (const [line_nr, executed] of counts){
            for (; last < line_nr; last++){
                if (this.profiled[last]){
                    const child = children[line_nr];
                    child.textContent = `${last+1}`;
                }
            }
            if (this.profile_check.checked){
                const child = children[line_nr];
                child.textContent = `${executed} ${line_nr+1}`;
            }
        }
    }
    private keydown_cb(event: KeyboardEvent){
        if (event.key === "Tab"){
            event.preventDefault();
            let start = this.input.selectionStart;
            let end = this.input.selectionEnd;
            if (!event.shiftKey && start === end){
                const value = this.input.value;
                const line_offset = start - line_start(value, start);
                const add_count = this.tab_width - (line_offset % this.tab_width) || this.tab_width
                this.input.value = str_splice(value, start, 0, " ".repeat(add_count));
                this.input.selectionStart = this.input.selectionEnd = start + add_count;
            } else {
                let src = this.input.value;
                if (event.shiftKey){
                    foreach_line_selected(src, start, end, (i) => {
                        const white_width = (regex_end(src, i, /^\s*/) ?? i) - i;
                        const delete_count = white_width === 0 ? 0 : white_width % this.tab_width || this.tab_width;
                        if (i < start){start -= delete_count;}
                        end -= delete_count;
                        src = str_splice(src, i, delete_count, "");
                        return src;
                    });
                    this.input.value = src;
                    this.input.selectionStart = start;
                    this.input.selectionEnd = end;
                } else {
                    foreach_line_selected(src, start, end, (i) => {
                        const white_width = (regex_end(src, i, /^\s*/) ?? i) - i;
                        const add_count = this.tab_width - (white_width % this.tab_width) || this.tab_width;
                        if (i < start){start += add_count;}
                        end += add_count;
                        src = str_splice(src, i, 0, " ".repeat(add_count));
                        return src;
                    });
                    this.input.value = src;
                    this.input.selectionStart = start;
                    this.input.selectionEnd = end;
                }
            }
            this.input_cb();
        } else if (event.key === "/" && event.ctrlKey) {
            let start = this.input.selectionStart;
            let end = this.input.selectionEnd;
            let src = this.input.value;
            foreach_line_selected(src, start, end, (i) => {
                const white_end = regex_end(src, i, /^\s*/) ?? i;
                if (regex_end(src, white_end, /^\/\//) === undefined){
                    src = str_splice(src, white_end, 0, "// ");
                    if (i < start){start += 3;}
                    end += 3;
                } else {
                    const delete_count = src[white_end + 2] === " " ? 3 : 2;
                    src = str_splice(src, white_end, delete_count, "");
                    if (i < start){start -= delete_count;}
                    end -= delete_count;
                }
                return src;
            });
            this.input.value = src;
            this.input.selectionStart = start;
            this.input.selectionEnd = end;
            this.input_cb();
        }
    }
    private input_cb(){
        this.input.style.height = "1px";
        const height = this.input.scrollHeight;
        this.input.style.width = `${this.input.scrollWidth}px`;
        this.input.style.height = `${height}px`;
        
        const src = this.input.value;
        const old_lines = this.old_lines;
        const lines = src.split("\n");
        this.old_lines = lines;
        {
            const width = (lines.length+"").length
            const start_lines = this.line_nrs.children.length
            const delta_lines = lines.length - start_lines;
            if (delta_lines > 0){
                for (let i = 0; i < delta_lines; i++){
                    const div = this.line_nrs.appendChild(document.createElement("div"));
                    div.textContent = pad_left(""+(start_lines+i+1), width);
                }
            } else {
                for (let i = 0; i < -delta_lines; i++){
                    this.line_nrs.lastChild?.remove()
                }
            }
        }
        
        const max_source_size = 100_000;
        if (src.length > max_source_size){
            this.input.style.color = "white";
            this.colors.style.color = "transparent";
            this.call_input_listeners();
            return
        } 
        this.input.style.color = "transparent";
        this.colors.style.display = "white";
        const min = Math.min(lines.length, old_lines.length);
        let start = 0;
        for (; start < min && lines[start] === old_lines[start]; start++);
        let end_i = 0;
        
        for (; end_i < min - start && lines.at(-end_i-1) === old_lines.at(-end_i-1); end_i++);
        
        const end = lines.length - end_i;
        const at_end = this.colors.children.item(old_lines.length - end_i);
        
        while (this.colors.children.length < lines.length){
            const elem = document.createElement("div");
            if (at_end){
                this.colors.insertBefore(elem, at_end);
            } else {
                this.colors.appendChild(elem);
            }
        }
        while (this.colors.children.length > lines.length){
            const child = this.colors.children[Math.min(this.colors.children.length, old_lines.length) - end_i - 1];
            if (!child){
                console.error("This should never happen");
                this.input.style.color = "white";
                this.colors.style.color = "transparent";
                break;
            }
            this.colors.removeChild(child);
        }


        
        for (let i = start; i < end; i++){
            const line = lines[i];
            const element = this.colors.children[i];
            const tokens: Token[] = [];
            tokenize(line, 0, tokens);
            if (tokens.length === 0){
                element.innerHTML = "<span>\n</span>";
                continue;
            }
            let span = element.firstElementChild;
            for (const {type, start, end} of tokens){
                if (!span){
                    span = document.createElement("span");
                    element.appendChild(span);
                }
                span.textContent = line.substring(start, end);
                span.className = type;
                span = span.nextElementSibling;
            }
            while (span){
                const next = span.nextElementSibling;
                element.removeChild(span);
                span = next;
            }
        }

        this.input.style.width = `${this.colors.scrollWidth}px`;
        this.colors.style.height = `${height}px`;
        this.call_input_listeners();
    }
    private call_input_listeners(){
        for (const listener of this.input_listeners){
            listener.call(this, new Event("input"));
        }
    }

    private input_listeners: ((this: GlobalEventHandlers, event: Event) => void)[] = [];
    set oninput(cb: (this: GlobalEventHandlers, event: Event) => void){
        this.input_listeners.push(cb);
    }
}
customElements.define("editor-window", Editor_Window);

function line_starts(src: string): number[] {
    const starts: number[] = [];
    for (let i = 0; i >= 0 && i < src.length; i++){
        starts.push(i);
        const next = src.indexOf("\n", i);
        i = next >= i ? next: src.length;
    }
    return starts;
}

function str_splice(string: string, index: number, delete_count: number, insert: string){
    return string.slice(0, index) + insert + string.slice(index + delete_count);
}


function foreach_line_selected(string: string, start: number, end: number, callback: (i: number) => string) {
    const first_line = line_start(string, start);
    let i = string.indexOf("\n", first_line) + 1 || string.length;
    let line_count = 1;
    for (;i < end; i = string.indexOf("\n", i) + 1 || string.length){
        line_count++;
    }
    for (let line = 0, i = first_line; line < line_count; line++){
        string = callback(i);
        i = string.indexOf("\n", i) + 1 || string.length;
    }
    return string;
}

function line_start(string: string, index: number): number {
    let i = 0, line_start = 0;
    for (;i <= index; i = string.indexOf("\n", i) + 1 || string.length){
        line_start = i;
        if (i >= string.length){
            line_start+1;
            break;
        }
    }
    return line_start;
}
