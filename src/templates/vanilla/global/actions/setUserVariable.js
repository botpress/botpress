/**
 * Stores a variable under this user's storage, with optional expiry
 * @title Set user variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 * @param {any} value - Set the value of the variable
 * @param {string} [expiry=never] - Set the expiry of the data, can be "never" or a short string like "6 hours"
 * @param {string} [output] - The state variable to output to
 */
const setUserVariable = async (name, value, expiry, output) => {
  const userId = event.target
  const key = bp.kvs.getUserStorageKey(userId, name)
  await bp.kvs.setStorageWithExpiry(event.botId, key, value, expiry)
  if (output) {
    state[output] = value
  }
  return { ...state }
}

return setUserVariable(args.name, args.value, args.expiry, args.output)
