/**
 * Stores a variable globally, with optional expiry
 * @title Set global variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 * @param {any} value - Set the value of the variable
 * @param {string} [expiry=never] - Set the expiry of the data, can be "never" or a short string like "6 hours"
 */
const setGlobalVariable = async (name, value, expiry) => {
  const key = bp.kvs.getGlobalStorageKey(name)
  await bp.kvs.setStorageWithExpiry(event.botId, key, value, expiry)
  return { ...state }
}

return setGlobalVariable(args.name, args.value, args.expiry)
