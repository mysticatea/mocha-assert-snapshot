import crypto from "crypto"
import fs from "fs"
import path from "path"
import rimraf from "rimraf"
import util from "util"
import { ensureDirectory } from "../../src/misc"

export function setupFiles(files: Record<string, string>): string {
    const workspacePath = createWorkspacePath()

    before(async () => {
        for (const [relativePath, content] of Object.entries(files)) {
            const filePath = path.resolve(workspacePath, relativePath)
            await ensureDirectory(path.dirname(filePath), path.dirname)
            await writeFile(filePath, content)
        }
    })

    after(async () => {
        await rmdir(workspacePath)
    })

    return workspacePath
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const writeFile = util.promisify(fs.writeFile)
const rmdir = util.promisify(rimraf)

function createWorkspacePath(): string {
    const t = Date.now().toString(16).slice(-6)
    const r = crypto.randomBytes(3).toString("hex")
    return path.join(process.cwd(), `.test-workspace/${t}${r}`)
}
