/**
 * Get a variable globally
 * @title Get global variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 * @param {string} output - The state variable to ouput to
 */
const getGlobalVariable = async (name, output) => {
  const key = bp.kvs.getGlobalStorageKey(name)
  const result = await bp.kvs.getStorageWithExpiry(event.botId, key)

  temp[output] = result
}

return getGlobalVariable(args.name, args.output)
