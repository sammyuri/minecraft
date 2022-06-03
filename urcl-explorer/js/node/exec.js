import { spawn } from "child_process";
export function my_exec(command, ...args) {
    return new Promise((res) => {
        const py = spawn(command, args);
        let out = "";
        let errors = "";
        py.stdout.on("data", (chunk) => {
            out += chunk;
        });
        py.stderr.on("data", (chunk) => {
            errors += chunk;
        });
        py.on("error", (err) => {
            errors += "\n" + err;
            res({ code: 1, out, errors });
        });
        py.on("close", (code, signal) => {
            code ||= 0;
            res({ code, out, errors });
        });
    });
}
//# sourceMappingURL=exec.js.map