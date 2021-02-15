import { ChildProcess, spawn } from "child_process"
import { setupFiles } from "./files"

const MochaPath = require.resolve("mocha/bin/mocha")

export const IndexPath = require.resolve("../../dist/index")
export const RegisterPath = IndexPath

export class Executor {
    static withFiles(files: Record<string, string>): Executor {
        return new Executor().setupFiles(files)
    }

    private currentCP: ChildProcess | undefined
    private cwd: string = process.cwd()

    private constructor() {
        afterEach(() => {
            this.currentCP?.kill()
            this.currentCP = undefined
        })
    }

    private setupFiles(files: Record<string, string>): this {
        this.cwd = setupFiles(files)
        return this
    }

    get workspacePath(): string {
        return this.cwd
    }

    mocha(...args: string[]): Promise<Executor.Result> {
        return this.mochaWithEnv(args, {})
    }

    mochaWithEnv(
        args: string[],
        env: Record<string, string>,
    ): Promise<Executor.Result> {
        this.currentCP?.kill()
        return new Promise((resolve, reject) => {
            const stdoutChunks: Buffer[] = []
            const stderrChunks: Buffer[] = []
            const child = (this.currentCP = spawn(
                process.execPath,
                [
                    MochaPath,
                    "--no-config",
                    "--require",
                    "ts-node/register",
                    ...args,
                ],
                {
                    cwd: this.cwd,
                    env: { ...process.env, ...env }, // eslint-disable-line no-process-env
                    stdio: ["ignore", "pipe", "pipe"],
                },
            )
                .on("error", error => {
                    if (this.currentCP === child) {
                        this.currentCP = undefined
                    }
                    reject(error)
                })
                .on("close", (code, signal) => {
                    if (this.currentCP === child) {
                        this.currentCP = undefined
                    }
                    resolve({
                        code,
                        signal,
                        stderr: Buffer.concat(stderrChunks).toString(),
                        stdout: Buffer.concat(stdoutChunks).toString(),
                    })
                }))
            child.stderr?.on("data", chunk => {
                // process.stderr.write(chunk)
                stderrChunks.push(chunk)
            })
            child.stdout?.on("data", chunk => {
                // process.stdout.write(chunk)
                stdoutChunks.push(chunk)
            })
        })
    }
}

export namespace Executor {
    export type Result = {
        code: number | null
        signal: NodeJS.Signals | null
        stderr: string
        stdout: string
    }
}
