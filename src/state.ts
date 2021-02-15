import { Snapshot } from "./snapshot"

export const snapshotMap = new Map<string, Snapshot>()

export let currentSnapshot: Snapshot | undefined

export function setCurrentSnapshot(snapshot: Snapshot | undefined): void {
    currentSnapshot = snapshot
}
