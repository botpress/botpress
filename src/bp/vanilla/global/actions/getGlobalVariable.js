/**
 * Get a variable globally
 * @title Get global variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 */
const getGlobalVariable = async name => {
  const key = bp.kvs.getGlobalStorageKey(name)
  const result = await bp.kvs.getStorageWithExpiry(event.botId, key)
  return { ...state, output: result }
}

getGlobalVariable(args.name)
