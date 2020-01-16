/**
 * Stores a variable globally, with optional expiry
 * @title Set global variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 * @param {any} value - Set the value of the variable
 * @param {string} [expiry=never] - Set the expiry of the data, can be "never" or a short string like "6 hours"
 * @param {string} [output] - The state variable to output to
 */
const setGlobalVariable = async (name, value, expiry, output) => {
  const key = bp.kvs.getGlobalStorageKey(name)
  await bp.kvs.forBot(event.botId).setStorageWithExpiry(key, value, expiry)
  if (output) {
    temp[output] = value
  }
}

return setGlobalVariable(args.name, args.value, args.expiry, args.output)
