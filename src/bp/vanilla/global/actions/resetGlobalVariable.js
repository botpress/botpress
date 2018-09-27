const key = bp.kvs.getGlobalStorageKey(name)
await bp.kvs.removeStorageKeysStartingWith(key)
