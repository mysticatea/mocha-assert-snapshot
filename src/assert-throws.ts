import { currentSnapshot } from "./state"

/**
 * Assert that a function throws an error that equals the previous snapshot.
 *
 * If the thrown error didn't equal the previous snapshot, this throws an error.
 *
 * If the function returned a promise, this awaits the promise then validates
 * the rejected value. In this case, this function returns a promise that will
 * be fulfilled after done the validation.
 *
 * In any of the following cases, this updates the snapshot rather than throwing
 * errors.
 * - No previous snapshots exist.
 * - `"--update"` exist in `process.argv`.
 * - `process.env.MOCHA_ASSERT_SNAPSHOT` is `"update"`.
 *
 * @param f The function that throws an error to compare with snapshot.
 * @throws {@link Error} Thrown if the function didn't throw any errors or the
 * thrown error didn't equal the previous snapshot.
 */
export function assertThrows<T>(
    f: () => T,
): T extends PromiseLike<any> ? Promise<void> : void {
    if (currentSnapshot == null) {
        throw new Error(
            'Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.',
        )
    }
    if (typeof f !== "function") {
        throw new TypeError('"f" must be a function')
    }

    return currentSnapshot.assert<T>(expected => {
        try {
            const retv: any = f()
            if (typeof retv?.then === "function") {
                return retv.then(
                    () => {
                        throw new Error(
                            `Expected to throw an error: ${
                                expected ?? "(not thrown yet)"
                            }`,
                        )
                    },
                    (error: any) => error,
                )
            }
        } catch (error) {
            return error
        }

        throw new Error(
            `Expected to throw an error: ${expected ?? "(not thrown yet)"}`,
        )
    })
}
