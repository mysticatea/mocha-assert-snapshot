import { currentSnapshot } from "./state"

/**
 * Assert that a function throws an error that equals the previous snapshot.
 *
 * If the thrown error didn't equal the previous snapshot, this throws an error.
 *
 * In any of the following cases, this updates the snapshot rather than throwing
 * errors.
 * - No previous snapshots exist.
 * - `"--update"` exist in `process.argv`.
 * - `process.env.MOCHA_ASSERT_SNAPSHOT` is `"update"`.
 *
 * @param func The function that throws an error to compare with snapshot.
 * @throws {@link Error} Thrown if the function didn't throw any errors or the
 * thrown error didn't equal the previous snapshot.
 */
export function assertSnapshotThrows<T>(
    func: () => T,
): T extends PromiseLike<any> ? Promise<void> : void {
    if (currentSnapshot == null) {
        throw new Error(
            'Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.',
        )
    }
    if (typeof func !== "function") {
        throw new TypeError('"func" must be a function')
    }

    const snapshot = currentSnapshot
    const key = snapshot.acquireSnapshotEntryKey()
    return normalizeCall(func, (thrown, error) => {
        if (thrown) {
            snapshot.assert(key, error)
        } else {
            const expected =
                snapshot.getSnapshotValue(key) ?? "(not thrown yet)"
            throw new Error(`Expected to throw an error: ${expected}`)
        }
    })
}

function normalizeCall(
    func: () => any,
    callback: (thrown: boolean, error: any) => void,
): any {
    let temp: any
    try {
        temp = func()
    } catch (error) {
        return callback(true, error)
    }

    if (typeof temp?.then !== "function") {
        return callback(false, undefined)
    }

    return temp.then(
        () => {
            callback(false, undefined)
        },
        (error: any) => {
            callback(true, error)
        },
    )
}
