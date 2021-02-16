import fs from 'fs';
import format from 'pretty-format';

class FlyweightPool {
    constructor(factory) {
        this.cache = new Map();
        this.factory = factory;
    }
    async get(key) {
        let value = this.cache.get(key);
        if (value === undefined) {
            value = await this.factory(key);
            this.cache.set(key, value);
        }
        return value;
    }
    values() {
        return this.cache.values();
    }
    clear() {
        this.cache.clear();
    }
}

// Wrap try-catch for running on browsers.
// Expected to replace `process.env.MOCHA_ASSERT_SNAPSHOT` with a concrete value
// in that case.
const isUpdateMode = try_(() => process.argv.includes("--update")) ||
    try_(() => process.env.MOCHA_ASSERT_SNAPSHOT === "update"); // eslint-disable-line no-process-env
function try_(f) {
    try {
        return f();
    }
    catch (_a) {
        //istanbul ignore next
        return false;
    }
}

function dirname(filePath) {
    const i = filePath.lastIndexOf("/");
    //istanbul ignore if
    if (i <= 0) {
        return filePath;
    }
    return filePath.slice(0, i);
}
async function ensureDirectory(filePath, pathDirname = dirname) {
    if (await isDirectory(filePath)) {
        return;
    }
    const dirPath = pathDirname(filePath);
    if (dirPath !== filePath) {
        await ensureDirectory(dirPath, pathDirname);
    }
    try {
        await mkdir(filePath);
    }
    catch (error) {
        //istanbul ignore next
        if (error.code === "EEXIST") {
            return;
        }
        //istanbul ignore next
        throw error;
    }
}
function isDirectory(filePath) {
    return new Promise(resolve => {
        fs.stat(filePath, (_error, stats) => {
            if (stats === null || stats === void 0 ? void 0 : stats.isDirectory()) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
function mkdir(filePath) {
    return new Promise((resolve, reject) => {
        fs.mkdir(filePath, error => {
            //istanbul ignore else
            if (error == null || error.code === "EEXIST") {
                resolve();
            }
            else {
                reject(error);
            }
        });
    });
}

class Snapshot {
    constructor(filePath) {
        this.content = Object.create(null);
        this.unusedKeys = new Set();
        this.updated = false;
        this.currentTest = "";
        this.currentIndex = 0;
        this.filePath = filePath;
    }
    setTestTitle(title) {
        if (title !== this.currentTest) {
            this.currentIndex = 0;
        }
        this.currentTest = title;
    }
    acquireSnapshotEntryKey() {
        const index = this.currentIndex++;
        const suffix = index === 0 ? " " : ` #${index}`;
        const key = `${this.currentTest}${suffix}`;
        this.unusedKeys.delete(key);
        return key;
    }
    getSnapshotValue(key) {
        return this.content[key];
    }
    assert(key, value) {
        const expected = this.content[key];
        const actual = format(value);
        if (isUpdateMode || expected === undefined) {
            this.content[key] = actual;
            this.updated = true;
        }
        else if (actual !== expected) {
            throw Object.assign(new Error("Different from the snapshot"), {
                code: "ERR_ASSERTION",
                operator: "strictEqual",
                actual,
                expected,
                generatedMessage: false,
            });
        }
        return this;
    }
    load() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, "utf8", (readError, data) => {
                if (readError != null) {
                    //istanbul ignore else
                    if (readError.code === "ENOENT") {
                        resolve(this);
                    }
                    else {
                        reject(readError);
                    }
                    return;
                }
                try {
                    new Function("exports", data)(this.content);
                    for (const key of Object.keys(this.content)) {
                        this.unusedKeys.add(key);
                    }
                    resolve(this);
                }
                catch (parseError) {
                    //istanbul ignore next
                    reject(parseError);
                }
            });
        });
    }
    save() {
        return new Promise((resolve, reject) => {
            // Clear unused data
            if (isUpdateMode) {
                for (const key of this.unusedKeys) {
                    delete this.content[key];
                    this.updated = true;
                }
            }
            // Done if no updated
            if (!this.updated) {
                resolve(this);
                return;
            }
            // Write
            const data = Object.entries(this.content)
                .map(([key, value]) => {
                const keyStr = JSON.stringify(key);
                const valStr = value.replace(/`|\$\{/gu, '$${"$&"}'); // eslint-disable-line no-template-curly-in-string
                return `exports[${keyStr}] = String.raw\`\n${valStr}\n\`.slice(1, -1)`;
            })
                .sort(undefined)
                .join("\n\n");
            ensureDirectory(dirname(this.filePath)).then(() => {
                fs.writeFile(this.filePath, data, writeError => {
                    //istanbul ignore else
                    if (writeError == null) {
                        resolve(this);
                    }
                    else {
                        reject(writeError);
                    }
                });
            }, reject);
        });
    }
}

const snapshotPool = new FlyweightPool((filePath) => new Snapshot(toSnapshotFilePath(filePath)).load());
let currentSnapshot;
function setCurrentSnapshot(snapshot) {
    currentSnapshot = snapshot;
}
function toSnapshotFilePath(filePath) {
    const ancestors = filePath.replace(/\\/gu, "/").split("/");
    const rawName = ancestors.pop();
    const name = (rawName === null || rawName === void 0 ? void 0 : rawName.endsWith(".js")) ? rawName : `${rawName}.js`;
    return [...ancestors, "__snapshot__", name].join("/");
}

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
function assertSnapshot(value) {
    if (currentSnapshot == null) {
        throw new Error('Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.');
    }
    const key = currentSnapshot.acquireSnapshotEntryKey();
    currentSnapshot.assert(key, value);
}

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
function assertSnapshotThrows(func) {
    if (currentSnapshot == null) {
        throw new Error('Snapshot wasn\'t initialized. Ensure giving "--require mocha-assert-snapshot" to mocha.');
    }
    if (typeof func !== "function") {
        throw new TypeError('"func" must be a function');
    }
    const snapshot = currentSnapshot;
    const key = snapshot.acquireSnapshotEntryKey();
    return normalizeCall(func, (thrown, error) => {
        var _a;
        if (thrown) {
            snapshot.assert(key, error);
        }
        else {
            const expected = (_a = snapshot.getSnapshotValue(key)) !== null && _a !== void 0 ? _a : "(not thrown yet)";
            throw new Error(`Expected to throw an error: ${expected}`);
        }
    });
}
function normalizeCall(func, callback) {
    let temp;
    try {
        temp = func();
    }
    catch (error) {
        return callback(true, error);
    }
    if (typeof (temp === null || temp === void 0 ? void 0 : temp.then) !== "function") {
        return callback(false, undefined);
    }
    return temp.then(() => {
        callback(false, undefined);
    }, (error) => {
        callback(true, error);
    });
}

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
const mochaHooks = {
    // Load snapshot and set the current test name.
    async beforeEach() {
        var _a, _b, _c, _d;
        const testFilePath = (_b = (_a = this.currentTest) === null || _a === void 0 ? void 0 : _a.file) !== null && _b !== void 0 ? _b : "anonymous.js";
        const snapshot = await snapshotPool.get(testFilePath);
        snapshot.setTestTitle((_d = (_c = this.currentTest) === null || _c === void 0 ? void 0 : _c.fullTitle()) !== null && _d !== void 0 ? _d : "");
        setCurrentSnapshot(snapshot);
    },
    // Reset the current test name.
    afterEach() {
        setCurrentSnapshot(undefined);
    },
    // Save snapshots.
    async afterAll() {
        const promises = Array.from(snapshotPool.values(), snapshot => snapshot.save());
        snapshotPool.clear();
        // Wait for all promises even if errored.
        let firstError = undefined;
        for (const promise of promises) {
            try {
                await promise;
            }
            catch (error) {
                //istanbul ignore next
                firstError = firstError !== null && firstError !== void 0 ? firstError : error;
            }
        }
        //istanbul ignore if
        if (firstError !== undefined) {
            throw firstError;
        }
    },
};

export { assertSnapshot, assertSnapshotThrows, mochaHooks };
//# sourceMappingURL=index.mjs.map
