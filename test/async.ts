import assert from "assert"
import fs from "fs"
import path from "path"
import util from "util"
import { Executor, IndexPath, RegisterPath } from "./lib/executor"
import { code } from "./lib/misc"

const readFile = util.promisify(fs.readFile)

describe("If promises are given, await for the promises", () => {
    const executor = Executor.withFiles({
        "test/assert-snapshot.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", async () => {
                await assertSnapshot(Promise.resolve({ value: "foo" }))
            })
        `,
        "test/assert-throws.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", async () => {
                await assertThrows(() => Promise.reject(new Error("foo")))
            })
        `,
        "test/assert-throws-not-throw.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", async () => {
                await assertThrows(() => Promise.resolve())
            })
        `,
    })

    describe("mocha test/assert-snapshot.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/assert-snapshot.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/assert-snapshot.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/assert-snapshot.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                content,
                code`
                    exports["snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "foo",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha test/assert-throws.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/assert-throws.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/assert-throws.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/assert-throws.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                content,
                code`
                    exports["snapshot-test "] = String.raw${"`"}
                    [Error: foo]
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha test/assert-throws-not-throw.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/assert-throws-not-throw.js",
            )
        })

        it("should finish with the exit code 1", () => {
            assert.strictEqual(result.code, 1, result.stderr)
        })

        it('should print "Expected to throw an error: (not thrown yet)"', () => {
            assert(
                result.stdout.includes(
                    "Expected to throw an error: (not thrown yet)",
                ),
                result.stdout,
            )
        })
    })
})
