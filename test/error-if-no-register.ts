import assert from "assert"
import fs from "fs"
import path from "path"
import util from "util"
import { Executor, IndexPath } from "./lib/executor"
import { code } from "./lib/misc"

const readFile = util.promisify(fs.readFile)

describe('If no "--require mocha-assert-snapshot" is present', () => {
    const executor = Executor.withFiles({
        "test/assert-snapshot.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
        `,
        "test/assert-throws.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertThrows(() => {
                    throw new Error("foo")
                })
            })
        `,
    })

    describe("mocha test/assert-snapshot.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha("test/assert-snapshot.js")
        })

        it("should finish with the exit code 1", () => {
            assert.strictEqual(result.code, 1, result.stderr)
        })

        it('should print [Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.]', () => {
            assert(
                result.stdout.includes(
                    'Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.',
                ),
                result.stdout,
            )
        })

        it('should not create "test/__snapshot__/assert-snapshot.js"', async () => {
            await assert.rejects(
                readFile(
                    path.join(
                        executor.workspacePath,
                        "test/__snapshot__/assert-snapshot.js",
                    ),
                    "utf8",
                ),
            )
        })
    })

    describe("mocha test/assert-throws.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha("test/assert-throws.js")
        })

        it("should finish with the exit code 1", () => {
            assert.strictEqual(result.code, 1, result.stderr)
        })

        it('should print [Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.]', () => {
            assert(
                result.stdout.includes(
                    'Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.',
                ),
                result.stdout,
            )
        })

        it('should not create "test/__snapshot__/assert-throws.js"', async () => {
            await assert.rejects(
                readFile(
                    path.join(
                        executor.workspacePath,
                        "test/__snapshot__/assert-throws.js",
                    ),
                    "utf8",
                ),
            )
        })
    })
})
