import { spawn } from "child_process";

export function my_exec(command: string, ...args: string[]): Promise<{out: string, errors: string, code: number}>{
    return new Promise((res) => {
        const py = spawn(command, args);
        let out = "";
        let errors = ""; 

        py.stdout.on("data", (chunk) => {
            out += chunk;
        });
        py.stderr.on("data" , (chunk) => {
            errors += chunk
        });

        py.on("error", (err) => {
            errors += "\n" + err;
            res({code: 1, out, errors});
        })

        py.on("close", (code, signal) => {
            code ||= 0;
            res({code, out, errors});
        })
    })
    
}




