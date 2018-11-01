/**
 * Get a variable under this user's storage
 * @title Get user variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 * @param {string} output - The state variable to ouput to
 */
const getUserVariable = async (name, output) => {
  const userId = event.target
  const key = bp.kvs.getUserStorageKey(userId, name)
  const result = await bp.kvs.getStorageWithExpiry(event.botId, key)
  return { ...state, [output]: result }
}

return getUserVariable(args.name, args.output)
