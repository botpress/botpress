const sessionId = event.threadId
const key = bp.kvs.getConversationStorageKey(sessionId, name)
const result = await bp.kvs.getStorageWithExpiry(event.botId, key)
return { ...state, [output]: result }
