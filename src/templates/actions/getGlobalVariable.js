const key = bp.kvs.getGlobalStorageKey(name)
const result = await bp.kvs.getStorageWithExpiry(event.botId, key)
return { ...state, [output]: result }
