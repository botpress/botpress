/**
 * Get number of conversations
 * @title Get number of conversations
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} output - The state variable to output the count to
 */
const getNumberOfConversations = async output => {
  const userId = event.target
  const botId = event.botId
  const key = bp.kvs.getUserStorageKey(userId, 'numberOfConversations')
  const value = await bp.kvs.getStorageWithExpiry(botId, key)

  temp[output] = value
}

return getNumberOfConversations(args.output)
