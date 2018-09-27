const userId = event.user.id
const key = bp.kvs.getUserStorageKey(userId, name)
await bp.kvs.removeStorageKeysStartingWith(key)
