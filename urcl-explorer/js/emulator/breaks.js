export var Break;
(function (Break) {
    Break[Break["ONREAD"] = 1] = "ONREAD";
    Break[Break["ONWRITE"] = 2] = "ONWRITE";
})(Break || (Break = {}));
export function break_flag(flags) {
    return flags.reduce((a, b) => a | b, 0);
}
//# sourceMappingURL=breaks.js.map