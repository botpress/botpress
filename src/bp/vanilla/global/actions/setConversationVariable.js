/**
 * Stores a variable under this conversation's storage, with optional expiry
 * @title Set conversation variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 * @param {any} value - Set the value of the variable
 * @param {string} [expiry=never] - Set the expiry of the data, can be "never" or a short string like "6 hours"
 * @param {string} [output] - The state variable to output to
 */
const setConversationVariable = async (name, value, expiry, output) => {
  const threadId = event.threadId
  const key = bp.kvs.getConversationStorageKey(threadId, name)
  await bp.kvs.setStorageWithExpiry(event.botId, key, value, expiry)
  if (output) {
    state[output] = value
  }
  return { ...state }
}

return setConversationVariable(args.name, args.value, args.expiry, args.output)
