import assert from "assert"
import fs from "fs"
import path from "path"
import util from "util"
import { Executor, IndexPath, RegisterPath } from "./lib/executor"
import { code } from "./lib/misc"

const readFile = util.promisify(fs.readFile)

describe("assertThrows(f)", () => {
    const executor = Executor.withFiles({
        "test/initial.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertThrows(() => {
                    throw new Error("foo")
                })
            })
        `,
        "test/initial-not-thrown.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertThrows(() => {})
            })
        `,
        "test/__snapshot__/equal.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            [Error: foo]
            ${"`"}.slice(1, -1)
        `,
        "test/equal.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertThrows(() => {
                    throw new Error("foo")
                })
            })
        `,
        "test/__snapshot__/not-equal.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            [Error: foo]
            ${"`"}.slice(1, -1)
        `,
        "test/not-equal.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertThrows(() => {
                    throw new Error("bar")
                })
            })
        `,
        "test/__snapshot__/not-thrown.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            [Error: foo]
            ${"`"}.slice(1, -1)
        `,
        "test/not-thrown.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertThrows(() => {})
            })
        `,
        "test/not-a-function.js": code`
            const { assertThrows } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertThrows("foo")
            })
        `,
    })

    describe("mocha --require mocha-assert-snapshot test/initial.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/initial.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/initial.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/initial.js",
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

    describe("mocha --require mocha-assert-snapshot test/initial-not-thrown.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/initial-not-thrown.js",
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
                'should print "Expected to throw an error: (not thrown yet)"',
            )
        })

        it('should not create "test/__snapshot__/initial-not-thrown.js"', async () => {
            await assert.rejects(
                readFile(
                    path.join(
                        executor.workspacePath,
                        "test/__snapshot__/initial-not-thrown.js",
                    ),
                    "utf8",
                ),
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/equal.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/equal.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should print "1 passing"', () => {
            assert(
                result.stdout.includes("1 passing"),
                'should print "1 passing"',
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/not-equal.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/not-equal.js",
            )
        })

        it("should finish with the exit code 1", () => {
            assert.strictEqual(result.code, 1, result.stderr)
        })

        it('should print "1 failing"', () => {
            assert(
                result.stdout.includes("1 failing"),
                'should print "1 failing"',
            )
        })

        it('should not update "test/__snapshot__/not-equal.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/not-equal.js",
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

    describe("mocha --require mocha-assert-snapshot test/not-thrown.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/not-thrown.js",
            )
        })

        it("should finish with the exit code 1", () => {
            assert.strictEqual(result.code, 1, result.stderr)
        })

        it('should print "1 failing"', () => {
            assert(
                result.stdout.includes("1 failing"),
                'should print "1 failing"',
            )
        })

        it('should print "Expected to throw an error: [Error: foo]"', () => {
            assert(
                result.stdout.includes(
                    "Expected to throw an error: [Error: foo]",
                ),
                'should print "Expected to throw an error: [Error: foo]"',
            )
        })

        it('should not update "test/__snapshot__/not-thrown.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/not-thrown.js",
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

    describe("mocha --require mocha-assert-snapshot test/not-a-function.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/not-a-function.js",
            )
        })

        it("should finish with the exit code 1", () => {
            assert.strictEqual(result.code, 1, result.stderr)
        })

        it('should print "1 failing"', () => {
            assert(
                result.stdout.includes("1 failing"),
                'should print "1 failing"',
            )
        })

        it('should print [TypeError: "f" must be a function]', () => {
            assert(
                result.stdout.includes('TypeError: "f" must be a function'),
                result.stdout,
            )
        })
    })
})
