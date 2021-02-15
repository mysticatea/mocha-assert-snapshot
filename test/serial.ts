import assert from "assert"
import fs from "fs"
import path from "path"
import util from "util"
import { Executor, IndexPath, RegisterPath } from "./lib/executor"
import { code } from "./lib/misc"

const readFile = util.promisify(fs.readFile)

describe("Run on multiple files (serial)", () => {
    const executor = Executor.withFiles({
        "test/__snapshot__/a.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/a.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
        `,
        "test/__snapshot__/b.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/b.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/__snapshot__/c.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/c.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
        `,
        "test/__snapshot__/d.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/d.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
    })

    describe("mocha --require mocha-assert-snapshot test/*.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/*.js",
            )
        })

        it("should finish with the exit code 2", () => {
            assert.strictEqual(result.code, 2, result.stderr)
        })

        it('should print "2 passing" and "2 failing"', () => {
            assert(
                result.stdout.includes("2 passing"),
                'should print "2 passing"',
            )
            assert(
                result.stdout.includes("2 failing"),
                'should print "2 failing"',
            )
        })

        it("should not update any snapshots", async () => {
            for (const name of ["a", "b", "c", "d"]) {
                const filePath = path.join(
                    executor.workspacePath,
                    `test/__snapshot__/${name}.js`,
                )
                const content = await readFile(filePath, "utf8")
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
            }
        })
    })

    describe("mocha --require mocha-assert-snapshot --update test/*.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--update",
                "--",
                "test/*.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should print "4 passing"', () => {
            assert(
                result.stdout.includes("4 passing"),
                'should print "4 passing"',
            )
        })

        it("should update snapshots", async () => {
            for (const name of ["a", "c"]) {
                const filePath = path.join(
                    executor.workspacePath,
                    `test/__snapshot__/${name}.js`,
                )
                const content = await readFile(filePath, "utf8")
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
            }
            for (const name of ["b", "d"]) {
                const filePath = path.join(
                    executor.workspacePath,
                    `test/__snapshot__/${name}.js`,
                )
                const content = await readFile(filePath, "utf8")
                assert.strictEqual(
                    content,
                    code`
                        exports["snapshot-test "] = String.raw${"`"}
                        Object {
                          "value": "bar",
                        }
                        ${"`"}.slice(1, -1)
                    `,
                )
            }
        })
    })
})
