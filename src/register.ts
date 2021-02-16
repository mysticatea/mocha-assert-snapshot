import { setCurrentSnapshot, snapshotPool } from "./state"

/**
 * Define the hooks to read/write snapshots.
 *
 * This is used in `--require mocha-assert-snapshot` as a root hook plugin.
 *
 * Don't use this object directly.
 * This package may change this object in a patch version.
 *
 * @internal
 * @see https://mochajs.org/#root-hook-plugins
 */
export const mochaHooks = {
    // Load snapshot and set the current test name.
    async beforeEach(this: any): Promise<void> {
        const testFilePath = this.currentTest?.file ?? "anonymous.js"
        const snapshot = await snapshotPool.get(testFilePath)
        snapshot.setTestTitle(this.currentTest?.fullTitle() ?? "")
        setCurrentSnapshot(snapshot)
    },

    // Reset the current test name.
    afterEach(this: any): void {
        setCurrentSnapshot(undefined)
    },

    // Save snapshots.
    async afterAll(): Promise<void> {
        const promises = Array.from(snapshotPool.values(), snapshot =>
            snapshot.save(),
        )
        snapshotPool.clear()

        // Wait for all promises even if errored.
        let firstError: unknown = undefined
        for (const promise of promises) {
            try {
                await promise
            } catch (error) {
                //istanbul ignore next
                firstError = firstError ?? error
            }
        }
        //istanbul ignore if
        if (firstError !== undefined) {
            throw firstError
        }
    },
}
