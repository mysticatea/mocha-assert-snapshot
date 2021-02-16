// Wrap try-catch for running on browsers.
// Expected to replace `process.env.MOCHA_ASSERT_SNAPSHOT` with a concrete value
// in that case.
export const isUpdateMode =
    try_(() => process.argv.includes("--update")) ||
    try_(() => process.env.MOCHA_ASSERT_SNAPSHOT === "update") // eslint-disable-line no-process-env

function try_(f: () => boolean): boolean {
    try {
        return f()
    } catch {
        //istanbul ignore next
        return false
    }
}
