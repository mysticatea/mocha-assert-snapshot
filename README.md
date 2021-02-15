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

Then use `assertSnapshot(value)` or `assertThrows(f)` in your tests.

```ts
import { assertSnapshot, assertThrows } from "mocha-assert-snapshot";

it("a snapshot test", () => {
  assertSnapshot({ value: "foo" });
});

it("a snapshot test for thrown errors", () => {
  assertThrows(() => {
    throw new Error("my error");
  });
});

it("those functions await promises automatically", async () => {
  await assertSnapshot(fs.promises.readFile("existence.txt"));
  await assertThrows(() => fs.promises.readFile("non-existence.txt"));
});
```

Of course, it works well along with the `--parallel` option.

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
