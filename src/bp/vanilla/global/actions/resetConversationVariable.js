const sessionId = event.threadId
const key = bp.kvs.getConversationStorageKey(sessionId, name)
await bp.kvs.removeStorageKeysStartingWith(event.botId, key)
