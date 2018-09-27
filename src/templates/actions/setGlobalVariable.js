const key = bp.kvs.getGlobalStorageKey(name)
await bp.kvs.setStorageWithExpiry(event.botId, key, value, expiry)
