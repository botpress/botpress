/**
 * Get number of conversations
 * @title Get number of conversations
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} output - The state variable to output the count to
 */
const getNumberOfConversations = async output => {
  const key = bp.kvs.getUserStorageKey(event.target, 'numberOfConversations')
  const value = await bp.kvs.forBot(event.botId).getStorageWithExpiry(key)

  temp[output] = value
}

return getNumberOfConversations(args.output)
