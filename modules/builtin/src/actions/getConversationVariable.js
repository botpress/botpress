/**
 * Get a variable from the conversation
 * @title Get conversation variable
 * @category Storage
 * @author David Vitor Antonio
 * @param {string} name - The name of the variable
 * @param {string} output - The state variable to ouput to
 */
const getConversationVariable = async (name, output) => {
  const key = bp.kvs.getConversationStorageKey(event.threadId, name)
  const result = await bp.kvs.getStorageWithExpiry(event.botId, key)

  temp[output] = result
}

return getConversationVariable(args.name, args.output)
