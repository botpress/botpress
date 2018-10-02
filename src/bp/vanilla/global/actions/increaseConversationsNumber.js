/**
 * Increase number of conversations
 * @title Increase number of conversations
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} output - The state variable to output the count to
 */
const increaseConversationsNumber = async output => {
  const userId = event.target
  const botId = event.botId
  const key = bp.kvs.getUserStorageKey(userId, 'numberOfConversations')
  let value = await bp.kvs.getStorageWithExpiry(botId, key)
  if (!value) {
    value = 0
  } else {
    value = Number(value)
    value = value++
  }
  await bp.kvs.setStorageWithExpiry(botId, key, value)
  return { ...state, [output]: value }
}

return increaseConversationsNumber(args.output)
