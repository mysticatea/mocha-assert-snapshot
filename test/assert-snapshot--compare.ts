import assert from "assert"
import fs from "fs"
import path from "path"
import util from "util"
import { Executor, IndexPath, RegisterPath } from "./lib/executor"
import { code } from "./lib/misc"

const readFile = util.promisify(fs.readFile)

describe("assertSnapshot(value) --compare--", () => {
    const executor = Executor.withFiles({
        "test/__snapshot__/equal.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/equal.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
        `,
        "test/__snapshot__/not-equal.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/not-equal.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/__snapshot__/update-by-arg.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/update-by-arg.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/__snapshot__/update-by-env.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/update-by-env.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/__snapshot__/adding-pass.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/adding-pass.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
            it("snapshot-test 2", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/__snapshot__/adding-fail.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/adding-fail.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "bar" })
            })
            it("snapshot-test 2", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/__snapshot__/deleting-extra.js": code`
            exports["snapshot-test "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
            
            exports["snapshot-test EXTRA"] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/deleting-extra.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
        `,
        "test/__snapshot__/deleting-all.js": code`
            exports["snapshot-test 1 "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
            
            exports["snapshot-test 2 "] = String.raw${"`"}
            Object {
              "value": "foo",
            }
            ${"`"}.slice(1, -1)
        `,
        "test/deleting-all.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test 1", () => {})
            it("snapshot-test 2", () => {})
        `,
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

        it("should print diff by mocha", () => {
            const expected = `
      Error: Different from the snapshot
      + expected - actual

       Object {
      -  "value": "bar",
      +  "value": "foo",
       }
`.trim()
            assert(result.stdout.includes(expected), "should print diff")
        })

        it("should not update snapshot", async () => {
            const snapshot = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/not-equal.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                snapshot,
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

    describe("mocha --require mocha-assert-snapshot --update test/update-by-arg.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--update",
                "--",
                "test/update-by-arg.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it("should update snapshot", async () => {
            const snapshot = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/update-by-arg.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                snapshot,
                code`
                    exports["snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("env MOCHA_ASSERT_SNAPSHOT=update mocha --require mocha-assert-snapshot test/update-by-env.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mochaWithEnv(
                ["--require", RegisterPath, "--", "test/update-by-env.js"],
                { MOCHA_ASSERT_SNAPSHOT: "update" },
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it("should update snapshot", async () => {
            const snapshot = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/update-by-env.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                snapshot,
                code`
                    exports["snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/adding-pass.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/adding-pass.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it("should update snapshot", async () => {
            const snapshot = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/adding-pass.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                snapshot,
                code`
                    exports["snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "foo",
                    }
                    ${"`"}.slice(1, -1)

                    exports["snapshot-test 2 "] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/adding-fail.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/adding-fail.js",
            )
        })

        it("should finish with the exit code 1", () => {
            assert.strictEqual(result.code, 1, result.stderr)
        })

        it("should update snapshot only for the new one", async () => {
            const snapshot = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/adding-fail.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                snapshot,
                code`
                    exports["snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "foo",
                    }
                    ${"`"}.slice(1, -1)

                    exports["snapshot-test 2 "] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/deleting-extra.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/deleting-extra.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it("should not update snapshot", async () => {
            const snapshot = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/deleting-extra.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                snapshot,
                code`
                    exports["snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "foo",
                    }
                    ${"`"}.slice(1, -1)
                    
                    exports["snapshot-test EXTRA"] = String.raw${"`"}
                    Object {
                      "value": "foo",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot --update test/deleting-extra.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--update",
                "--",
                "test/deleting-extra.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it("should update snapshot", async () => {
            const snapshot = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/deleting-extra.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                snapshot,
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

    describe("mocha --require mocha-assert-snapshot --update test/deleting-all.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--update",
                "--",
                "test/deleting-all.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it("should remove the snapshot file", async () => {
            try {
                await readFile(
                    path.join(
                        executor.workspacePath,
                        "test/__snapshot__/deleting-all.js",
                    ),
                    "utf8",
                )
            } catch (error) {
                assert.strictEqual(error.code, "ENOENT")
                return
            }

            assert.fail("should throw ENOENT error")
        })
    })
})
