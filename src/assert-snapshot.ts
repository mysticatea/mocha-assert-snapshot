import { currentSnapshot } from "./state"

/**
 * Assert that a value equals the previous snapshot.
 *
 * If the value didn't equal the previous snapshot, this throws an error.
 *
 * In any of the following cases, this updates the snapshot rather than throwing
 * errors.
 * - No previous snapshots exist.
 * - `"--update"` exist in `process.argv`.
 * - `process.env.MOCHA_ASSERT_SNAPSHOT` is `"update"`.
 *
 * @param value The value to compare with snapshot.
 * @throws {@link Error} Thrown if the value didn't equal the previous snapshot.
 */
export function assertSnapshot(value: unknown): void {
    if (currentSnapshot == null) {
        throw new Error(
            'Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.',
        )
    }

    const key = currentSnapshot.acquireSnapshotEntryKey()
    currentSnapshot.assert(key, value)
}
