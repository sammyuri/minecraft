import { f32_encode, warn, Warning } from "./util.js";

const f32 = /\d*\.?\d*f32/g;

export function preprocess(str: string, errors: Warning[]){
    const macros: Record<string, string> = {};
    const lines = str.replaceAll("\r", "").split("\n");
    let source = "";
    for (let i = 0; i < lines.length; i++){
        const line = lines[i].trim();
        const [start, name, ...rest] = line.split(/[ \t]+/);
        if (start.toLowerCase() !== "@define"){
            source += line + "\n";
            continue;
        }
        if (!name){
            errors.push(warn(i, `no name specified for macro`));
            continue
        }
        if (macros[name]){
            errors.push(warn(i, `redefinition of macro ${name}`));
            continue;
        }
        macros[name] = rest.join(" ");
    }
    let last = "";
    while (source !== last){
        last = source;
        for (const [name, macro] of Object.entries(macros)){
            source = source.replaceAll(name, macro);
        }
    }
    const matches = source.match(f32);
    if (matches) for (const match of matches){
        const float = parseFloat(match.slice(0, -3));
        if (Number.isNaN(float)){
            errors.push(warn(-1, `${match} is not a number`));
            continue;
        }
        const int = f32_encode(float);
        source = source.replace(match, int.toString());
    }

    return source;
}
