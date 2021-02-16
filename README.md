# mocha-assert-snapshot

[![npm version](https://img.shields.io/npm/v/mocha-assert-snapshot.svg)](https://www.npmjs.com/package/mocha-assert-snapshot)
[![Downloads/month](https://img.shields.io/npm/dm/mocha-assert-snapshot.svg)](http://www.npmtrends.com/mocha-assert-snapshot)
[![Build Status](https://github.com/mysticatea/mocha-assert-snapshot/workflows/CI/badge.svg)](https://github.com/mysticatea/mocha-assert-snapshot/actions)
[![codecov](https://codecov.io/gh/mysticatea/mocha-assert-snapshot/branch/main/graph/badge.svg)](https://codecov.io/gh/mysticatea/mocha-assert-snapshot)
[![Dependency Status](https://david-dm.org/mysticatea/mocha-assert-snapshot.svg)](https://david-dm.org/mysticatea/mocha-assert-snapshot)

A snapshot testing utility for [Mocha].

[mocha]: https://mochajs.org/

## 🏁 Goal

This package provides utilities to do [Snapshot Testing] on [Mocha].

[snapshot testing]: https://jestjs.io/docs/en/snapshot-testing

## 💿 Installation

Use [npm] or a compatible tool to install.

```
npm install mocha-assert-snapshot
```

[npm]: https://www.npmjs.com/

## 📖 Usage

Give `--require mocha-assert-snapshot` option to [Mocha].

```
mocha --require mocha-assert-snapshot -- test/**/*.js
```

It registers root hooks to read/write snapshots.

Then use `assertSnapshot(value)` or `assertSnapshotThrows(func)` in your tests.

```ts
import { assertSnapshot, assertSnapshotThrows } from "mocha-assert-snapshot";

it("a snapshot test", () => {
  const actual = doSomething();
  assertSnapshot(actual);
});

it("a snapshot test (async)", async () => {
  const actual = await doSomething();
  assertSnapshot(actual);
});

it("a snapshot test for thrown errors", () => {
  assertSnapshotThrows(() => {
    throw new Error("my error");
  });
});

it("a snapshot test for thrown errors (async)", async () => {
  await assertSnapshotThrows(async () => {
    throw new Error("my error");
  });
});
```

Of course, it works well along with the `--parallel` option.

### ■ Update Snapshot

There are two ways to update snapshots.

#### 1. `--update`

Giving `--update` CLI option, it updates snapshots.

```
mocha --require mocha-assert-snapshot --update -- test/**/*.js
```

It's nice, but it doesn't work on parallel mode because Mocha doesn't pass the CLI arguments to workers.

#### 2. `MOCHA_ASSERT_SNAPSHOT=update`

Giving `MOCHA_ASSERT_SNAPSHOT=update` environment variable, it updates snapshots.

```
MOCHA_ASSERT_SNAPSHOT=update mocha --require mocha-assert-snapshot -- test/**/*.js
```

If you want to use this way on cross-platform, use [cross-env] package or something like that.

[cross-env]: https://www.npmjs.com/package/cross-env

## 📰 Changelog

See [GitHub Releases](https://github.com/mysticatea/mocha-assert-snapshot/releases).

## 🍻 Contributing

Welcome contributing!

Please use GitHub's Issues/PRs.

### Development Tools

- `npm test` runs tests and measures coverage.
- `npm run build` compiles source code to index.mjs, index.js, index.mjs.map, index.js.map, and index.d.ts.
- `npm run clean` removes the temporary files which are created by npm test and npm run build.
- `npm run format` runs Prettier.
- `npm run lint` runs ESLint.
- `npm version <patch|minor|major>` makes a new release.
