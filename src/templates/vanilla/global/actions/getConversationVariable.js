/**
 * Get a variable under this conversation's storage
 * @title Get conversation variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 * @param {string} output - The state variable to output to
 */
const getConversationVariable = async (name, output) => {
  const sessionId = event.threadId
  const key = bp.kvs.getConversationStorageKey(sessionId, name)
  const result = await bp.kvs.getStorageWithExpiry(event.botId, key)
  return { ...state, [output]: result }
}

return getConversationVariable(args.name, args.output)
