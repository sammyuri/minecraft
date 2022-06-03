export function bind<V extends any[], T extends any[], R>(func: (...rest: [...V, ...T]) => R, ...args: V)
    : (...args: T) => R
{
    return (func as any).bind(null, ...args);
}
export function regex_end(src: string, i: number, regex: RegExp): undefined | number {
    const res = regex.exec(src.substring(i));
    if (res === null || res.index !== 0){return undefined;}
    return i + res[0].length;
}


export interface Token {
    type: Token_Type,
    start: number,
    end: number,
}
interface Error {
    start: number,
    end: number,
    msg: string,
    cause?: Error,
}

enum Tok_Code {
    Skip = "skip"
}

type Tok = (src: string, i: number, tokens: Token[]) => number;
type Tok_Opt = (src: string, i: number, tokens: Token[]) => Tok_Code.Skip | number;

function or(toks: Tok[], src: string, i: number, tokens: Token[]): number {
    for (const tok of toks){
        const next = tok(src, i, tokens);
        if (next !== i){
            return next;
        }
    }
    return i;
}
function and(toks: Tok_Opt[], src: string, i: number, tokens: Token[]): number {
    for (let tok_i = 0; tok_i < toks.length; tok_i++){
        const tok = toks[tok_i];
        const next = tok(src, i, tokens);
        if (next === i){
            return i;
        }
        if (next !== Tok_Code.Skip){
            i = next;
        }
    }
    return i;
}
function opt(tok: Tok, src: string, i: number, tokens: Token[]): Tok_Code.Skip | number {
    const end = tok(src, i, tokens);
    return end === i ? Tok_Code.Skip  : end;
}

function list(tok: Tok_Opt, src: string, i: number, tokens: Token[]): number {
    while (i < src.length){
        const next = tok(src, i, tokens);
        if (next === i){
            return i;
        }
        if (next !== Tok_Code.Skip){
            i = next;
        }
    }
    return i;
}
function delimit(delimiter: Tok, tok: Tok, src: string, i: number, tokens: Token[]): number {
    while (i < src.length){
        const next = tok(src, i, tokens);
        if (next === i){
            return i;
        }
        i = next;
        const delimit_end = delimiter(src, i, tokens);
        if (delimit_end === i){
            return i;
        }
        i = delimit_end;
    }
    return i;
}

function regex(type: Token_Type, regex: RegExp, src: string, i: number, tokens: Token[]): number {
    const end = regex_end(src, i , regex);
    if (end === undefined){
        return i;
    }
    tokens.push({type, start: i, end});
    return end;
}

enum Token_Type {
    Unknown = "unknown",
    Comment = "comment",
    Comment_Multi = "comment-multi",
    White = "white",
    White_inline = "white-inline",
    Opcode = "opcode",
    DW = "dw",
    Square_Open = "square-open",
    Square_Close = "square-close",
    Number = "number",
    Register = "register",
    Port = "port",
    Memory = "memory",
    Escape = "escape",
    Quote_String = "quote-string",
    Quote_Char = "quote-char",
    Text = "text",
    Macro = "macro",
    Name = "name",
    Expansion = "expansion",
    Label = "label",
    Relative = "relative",
    Comparator = "comparator"
}

function tok_comment_multi(src: string, i: number, tokens: Token[]): number {
    if (src.substring(i, 2) !== "/*"){
        return i;
    }
    const start = i;
    for (i += 2; i < src.length; i++){
        if (src.substring(i, 2) === "*/"){
            break;
        }
    }
    const end = Math.min(src.length, i+2);
    tokens.push({type: Token_Type.Comment_Multi, start, end});
    return end;
}
const tok_comment = bind(regex, Token_Type.Comment, /^\/\/[^\n]*/);
const tok_white = bind(regex, Token_Type.White, /^\s+/);
const tok_white_inline = bind(regex, Token_Type.White_inline, /^(,|[^\S\n])+/);
const tok_number =  bind(regex, Token_Type.Number, /^-?(0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)/);
const tok_register =  bind(regex, Token_Type.Register, /^[Rr$]([0-9_]+|0x[0-9a-fA-F_]+|0b[01_]+)/);
const tok_port =  bind(regex, Token_Type.Port, /^%\w+/);
const tok_memory =  bind(regex, Token_Type.Port, /^[#mM]([0-9_]+|0x[0-9a-fA-F_]+|0b[01_]+)/);
const tok_escape = bind(regex, Token_Type.Escape, /^\\(x[0-9a-fA-F_]+|.)/);
const tok_char_quote = bind(regex, Token_Type.Quote_Char, /^'/);
const tok_string_quote = bind(regex, Token_Type.Quote_String, /^"/);
const tok_relative = bind(regex, Token_Type.Relative, /^~-?(0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)/);
const tok_label = bind(and, [
    bind(regex, Token_Type.Label, /^\.\w+/),
    bind(opt, bind(regex, Token_Type.Number, /\+\d+/)),
    bind(list, bind(or, [
        tok_comment, tok_white_inline
    ]))
]);

const tok_char = bind(and, [
    tok_char_quote,
    bind(or, [
        tok_escape,
        bind(regex, Token_Type.Text, /^[^'\\]/)
    ]),
    tok_char_quote
]);

const tok_string = bind(and, [
    tok_string_quote,
    bind(list, bind(or, [
        tok_escape,
        bind(regex, Token_Type.Text, /^[^"\\]+/)
    ])),
    tok_string_quote
]);

export const tokenize = bind(list, bind(or, [
    tok_white,
    tok_white_inline,
    bind(regex, Token_Type.Comparator, /^<=|>=|==/),
    bind(regex, Token_Type.Macro, /^BITS|MINREG|MINHEAP|MINSTACK|RUN/i),
    bind(regex, Token_Type.Text, /^RAM|ROM/i),
    tok_number,
    tok_char,
    tok_string,
    tok_register,
    tok_port,
    tok_memory,
    tok_label,
    tok_relative,
    tok_comment,
    // tok_comment_multi,
    bind(regex, Token_Type.Square_Open, /\[/),
    bind(regex, Token_Type.Square_Close, /\]/),
    bind(regex, Token_Type.Macro, /^@[a-zA-Z_][a-zA-Z_0-9]*/),
    bind(regex, Token_Type.Name, /^[a-zA-Z_][a-zA-Z_0-9]*/),
    bind(regex, Token_Type.Unknown, /^\S+/),
]));
