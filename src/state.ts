import { FlyweightPool } from "./flyweight-pool"
import { Snapshot } from "./snapshot"

export const snapshotPool = new FlyweightPool((filePath: string) =>
    new Snapshot(toSnapshotFilePath(filePath)).load(),
)

export let currentSnapshot: Snapshot | undefined
export function setCurrentSnapshot(snapshot: Snapshot | undefined): void {
    currentSnapshot = snapshot
}

function toSnapshotFilePath(filePath: string): string {
    const ancestors = filePath.replace(/\\/gu, "/").split("/")
    const rawName = ancestors.pop()
    const name = rawName?.endsWith(".js") ? rawName : `${rawName}.js`
    return [...ancestors, "__snapshot__", name].join("/")
}
