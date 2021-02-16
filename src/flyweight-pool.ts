export class FlyweightPool<K, V> {
    private readonly factory: (key: K) => Promise<V>
    private readonly cache = new Map<K, V>()

    constructor(factory: (key: K) => Promise<V>) {
        this.factory = factory
    }

    async get(key: K): Promise<V> {
        let value = this.cache.get(key)
        if (value === undefined) {
            value = await this.factory(key)
            this.cache.set(key, value)
        }
        return value
    }

    values(): IterableIterator<V> {
        return this.cache.values()
    }

    clear(): void {
        this.cache.clear()
    }
}
