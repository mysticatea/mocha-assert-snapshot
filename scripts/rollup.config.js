import typescript from "@rollup/plugin-typescript"
import path from "path"

const prod = process.env.NODE_ENV === "production"

function sourcemapPathTransform(filePath) {
    const prefix = `..${path.sep}`
    return prod && filePath.startsWith(prefix)
        ? filePath.slice(prefix.length)
        : filePath
}

/** @type {import("rollup").RollupOptions} */
const options = {
    external: ["fs", "pretty-format"],
    input: "src/index.ts",
    output: [
        {
            file: "dist/index.mjs",
            format: "esm",
            sourcemap: true,
            sourcemapPathTransform,
        },
        {
            file: "dist/index.js",
            format: "cjs",
            sourcemap: true,
            sourcemapPathTransform,
        },
    ],
    plugins: [typescript({ tsconfig: "tsconfig/build.json" })],
    treeshake: {
        moduleSideEffects: false,
        unknownGlobalSideEffects: false,
    },
}

export default options
