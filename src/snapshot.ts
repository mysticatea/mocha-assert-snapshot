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

    acquireSnapshotEntryKey(): string {
        const index = this.currentIndex++
        const suffix = index === 0 ? " " : ` #${index}`
        const key = `${this.currentTest}${suffix}`

        this.unusedKeys.delete(key)

        return key
    }

    getSnapshotValue(key: string): string | undefined {
        return this.content[key]
    }

    assert(key: string, value: unknown): this {
        const expected = this.content[key]
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

        return this
    }

    load(): Promise<this> {
        return new Promise<this>((resolve, reject) => {
            fs.readFile(this.filePath, "utf8", (readError, data) => {
                if (readError != null) {
                    //istanbul ignore else
                    if (readError.code === "ENOENT") {
                        resolve(this)
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

                    resolve(this)
                } catch (parseError) {
                    //istanbul ignore next
                    reject(parseError)
                }
            })
        })
    }

    save(): Promise<this> {
        return new Promise<this>((resolve, reject) => {
            // Clear unused data
            if (isUpdateMode) {
                for (const key of this.unusedKeys) {
                    delete this.content[key]
                    this.updated = true
                }
            }

            // Done if no updated
            if (!this.updated) {
                resolve(this)
                return
            }

            // Generate the content of this snapshot file
            const data = Object.entries(this.content)
                .map(([key, value]) => {
                    const keyStr = JSON.stringify(key)
                    const valStr = value.replace(/`|\$\{/gu, '$${"$&"}') // eslint-disable-line no-template-curly-in-string
                    return `exports[${keyStr}] = String.raw\`\n${valStr}\n\`.slice(1, -1)`
                })
                .sort(undefined)
                .join("\n\n")

            if (data !== "") {
                // Save the snapshot to file
                ensureDirectory(dirname(this.filePath)).then(() => {
                    fs.writeFile(this.filePath, data, writeError => {
                        //istanbul ignore else
                        if (writeError == null) {
                            resolve(this)
                        } else {
                            reject(writeError)
                        }
                    })
                }, reject)
            } else {
                // Remove the snapshot file
                fs.unlink(this.filePath, () => {
                    resolve(this)
                })
            }
        })
    }
}
