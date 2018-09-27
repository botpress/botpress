const userId = event.user.id
const key = bp.kvs.getUserStorageKey(userId, name)
const result = await bp.kvs.getStorageWithExpiry(event.botId, key)
return { ...state, [output]: result }
