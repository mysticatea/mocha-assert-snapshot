import fs from "fs"

export function dirname(filePath: string): string {
    const i = filePath.lastIndexOf("/")
    //istanbul ignore if
    if (i <= 0) {
        return filePath
    }
    return filePath.slice(0, i)
}

export async function ensureDirectory(
    filePath: string,
    pathDirname = dirname,
): Promise<void> {
    if (await isDirectory(filePath)) {
        return
    }

    const dirPath = pathDirname(filePath)
    if (dirPath !== filePath) {
        await ensureDirectory(dirPath, pathDirname)
    }
    try {
        await mkdir(filePath)
    } catch (error) {
        //istanbul ignore next
        if (error.code === "EEXIST") {
            return
        }
        //istanbul ignore next
        throw error
    }
}

function isDirectory(filePath: string): Promise<boolean> {
    return new Promise(resolve => {
        fs.stat(filePath, (_error, stats) => {
            if (stats?.isDirectory()) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

function mkdir(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.mkdir(filePath, error => {
            //istanbul ignore else
            if (error == null || error.code === "EEXIST") {
                resolve()
            } else {
                reject(error)
            }
        })
    })
}
