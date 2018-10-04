/**
 * Reset a variable under this user's storage
 * @title Reset user variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} name - The name of the variable
 */
const resetUserVariable = async name => {
  const userId = event.target
  const key = bp.kvs.getUserStorageKey(userId, name)
  await bp.kvs.removeStorageKeysStartingWith(key)
}

return resetUserVariable(args.name)
