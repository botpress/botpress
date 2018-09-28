/**
 * Get a variable under this conversation's storage
 * @title Get conversation variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 */
const getConversationVariable = async name => {
  const sessionId = event.threadId
  const key = bp.kvs.getConversationStorageKey(sessionId, name)
  const result = await bp.kvs.getStorageWithExpiry(event.botId, key)
  return { ...state, output: result }
}

getConversationVariable(args.name)
