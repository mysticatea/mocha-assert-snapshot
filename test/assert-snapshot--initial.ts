import assert from "assert"
import fs from "fs"
import path from "path"
import util from "util"
import { Executor, IndexPath, RegisterPath } from "./lib/executor"
import { code } from "./lib/misc"

const readFile = util.promisify(fs.readFile)

describe("assertSnapshot(value) --initial--", () => {
    const executor = Executor.withFiles({
        "test/empty.js": code`
            it("snapshot-test", () => {
            })
        `,
        "test/one.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
        `,
        "test/two.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
            it("another-test", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/two-describe.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            describe("describe-one", () => {
                it("snapshot-test", () => {
                    assertSnapshot({ value: "foo" })
                })
            })
            describe("describe-two", () => {
                it("snapshot-test", () => {
                    assertSnapshot({ value: "bar" })
                })
            })
        `,
        "test/two-in-a-test.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
                assertSnapshot({ value: "bar" })
            })
        `,
        "test/two-same-name-it.js": code`
            const { assertSnapshot } = require(${JSON.stringify(IndexPath)})
            it("snapshot-test", () => {
                assertSnapshot({ value: "foo" })
            })
            it("snapshot-test", () => {
                assertSnapshot({ value: "bar" })
            })
        `,
    })

    describe("mocha --require mocha-assert-snapshot test/empty.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/empty.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should not create "test/__snapshot__/empty.js"', async () => {
            await assert.rejects(
                readFile(
                    path.join(
                        executor.workspacePath,
                        "test/__snapshot__/empty.js",
                    ),
                    "utf8",
                ),
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/one.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/one.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/one.js"', async () => {
            const content = await readFile(
                path.join(executor.workspacePath, "test/__snapshot__/one.js"),
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

    describe("mocha --require mocha-assert-snapshot test/two.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/two.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/two.js"', async () => {
            const content = await readFile(
                path.join(executor.workspacePath, "test/__snapshot__/two.js"),
                "utf8",
            )
            assert.strictEqual(
                content,
                code`
                    exports["another-test "] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                    
                    exports["snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "foo",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/two-describe.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/two-describe.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/two-describe.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/two-describe.js",
                ),
                "utf8",
            )
            assert.strictEqual(
                content,
                code`
                    exports["describe-one snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "foo",
                    }
                    ${"`"}.slice(1, -1)

                    exports["describe-two snapshot-test "] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/two-in-a-test.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/two-in-a-test.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/two-in-a-test.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/two-in-a-test.js",
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

                    exports["snapshot-test #1"] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })

    describe("mocha --require mocha-assert-snapshot test/two-same-name-it.js", () => {
        let result: Executor.Result
        before(async () => {
            result = await executor.mocha(
                "--require",
                RegisterPath,
                "--",
                "test/two-same-name-it.js",
            )
        })

        it("should finish with the exit code 0", () => {
            assert.strictEqual(result.code, 0, result.stderr)
        })

        it('should create "test/__snapshot__/two-same-name-it.js"', async () => {
            const content = await readFile(
                path.join(
                    executor.workspacePath,
                    "test/__snapshot__/two-same-name-it.js",
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

                    exports["snapshot-test #1"] = String.raw${"`"}
                    Object {
                      "value": "bar",
                    }
                    ${"`"}.slice(1, -1)
                `,
            )
        })
    })
})
