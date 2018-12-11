/**
 * Reset a variable globally
 * @title Reset global variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 */
const resetGlobalVariable = async name => {
  const key = bp.kvs.getGlobalStorageKey(name)
  await bp.kvs.removeStorageKeysStartingWith(key)
}

return resetGlobalVariable(args.name)
