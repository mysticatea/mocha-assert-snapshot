import { Snapshot } from "./snapshot"
import { setCurrentSnapshot, snapshotMap } from "./state"

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
        let snapshot = snapshotMap.get(testFilePath)
        if (snapshot == null) {
            snapshot = new Snapshot(toSnapshotFilePath(testFilePath))
            await snapshot.load()
            snapshotMap.set(testFilePath, snapshot)
        }
        snapshot.setTestTitle(this.currentTest?.fullTitle() ?? "")
        setCurrentSnapshot(snapshot)
    },

    // Reset the current test name.
    afterEach(this: any): void {
        setCurrentSnapshot(undefined)
    },

    // Save snapshots.
    async afterAll(): Promise<void> {
        const promises = Array.from(snapshotMap.values(), snapshot =>
            snapshot.save(),
        )
        snapshotMap.clear()
        await Promise.all(promises)
    },
}

function toSnapshotFilePath(filePath: string): string {
    const ancestors = filePath.replace(/\\/gu, "/").split("/")
    const rawName = ancestors.pop()
    const name = rawName?.endsWith(".js") ? rawName : `${rawName}.js`
    return [...ancestors, "__snapshot__", name].join("/")
}
