/**
 * Reset a variable under this conversation's storage
 * @title Reset conversation variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 */
const resetConversationVariable = async name => {
  const sessionId = event.threadId
  const key = bp.kvs.getConversationStorageKey(sessionId, name)
  await bp.kvs.removeStorageKeysStartingWith(event.botId, key)
}

return resetConversationVariable(args.name)
