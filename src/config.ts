export const isUpdateMode =
    process.argv.includes("--update") ||
    process.env.MOCHA_ASSERT_SNAPSHOT === "update" // eslint-disable-line no-process-env
