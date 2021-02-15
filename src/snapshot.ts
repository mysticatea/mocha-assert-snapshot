import fs from "fs"
import format from "pretty-format"
import { isUpdateMode } from "./config"
import { dirname, ensureDirectory } from "./misc"

export class Snapshot {
    private readonly filePath: string
    private readonly content: Record<string, string> = Object.create(null)
    private readonly unusedKeys = new Set<string>()
    private updated = false
    private currentTest = ""
    private currentIndex = 0

    constructor(filePath: string) {
        this.filePath = filePath
    }

    setTestTitle(title: string): void {
        if (title !== this.currentTest) {
            this.currentIndex = 0
        }
        this.currentTest = title
    }

    assert<T>(
        f: (expected: string) => T,
    ): T extends PromiseLike<any> ? Promise<void> : void {
        const index = this.currentIndex++
        const suffix = index === 0 ? " " : ` #${index}`
        const key = `${this.currentTest}${suffix}`
        this.unusedKeys.delete(key)

        const expected = this.content[key]
        const tmp: any = f(expected)

        const postprocess = (value: unknown) => {
            const actual = format(value)

            if (isUpdateMode || expected === undefined) {
                this.content[key] = actual
                this.updated = true
            } else if (actual !== expected) {
                throw Object.assign(new Error("Different from the snapshot"), {
                    code: "ERR_ASSERTION",
                    operator: "strictEqual",
                    actual,
                    expected,
                    generatedMessage: false,
                })
            }
        }

        if (typeof tmp?.then !== "function") {
            return postprocess(tmp) as any
        }
        return tmp.then(postprocess)
    }

    load(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(this.filePath, "utf8", (readError, data) => {
                if (readError != null) {
                    //istanbul ignore else
                    if (readError.code === "ENOENT") {
                        resolve()
                    } else {
                        reject(readError)
                    }
                    return
                }
                try {
                    new Function("exports", data)(this.content)
                    for (const key of Object.keys(this.content)) {
                        this.unusedKeys.add(key)
                    }

                    resolve()
                } catch (parseError) {
                    //istanbul ignore next
                    reject(parseError)
                }
            })
        })
    }

    save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Clear unused data
            if (isUpdateMode) {
                for (const key of this.unusedKeys) {
                    delete this.content[key]
                    this.updated = true
                }
            }

            // Done if no updated
            if (!this.updated) {
                resolve()
                return
            }

            // Write
            const data = Object.entries(this.content)
                .map(([key, value]) => {
                    const keyStr = JSON.stringify(key)
                    const valStr = value.replace(/`|\$\{/gu, '$${"$&"}') // eslint-disable-line no-template-curly-in-string
                    return `exports[${keyStr}] = String.raw\`\n${valStr}\n\`.slice(1, -1)`
                })
                .sort(undefined)
                .join("\n\n")

            ensureDirectory(dirname(this.filePath)).then(() => {
                fs.writeFile(this.filePath, data, writeError => {
                    //istanbul ignore if
                    if (writeError != null) {
                        reject(writeError)
                    } else {
                        resolve()
                    }
                })
            }, reject)
        })
    }
}
