/**
 * Remove a variable from storage.
 *
 * @title Remove Variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} type - Pick between: user, session, temp, bot
 * @param {string} name - The name of the variable
 */
const removeVariable = async (type, name) => {
  if (type === 'bot') {
    const original = await bp.kvs.forBot(event.botId).get('global')
    await bp.kvs.forBot(event.botId).set('global', { ...original, [name]: 'null' })
  } else {
    delete event.state[type][name]
  }
}

return removeVariable(args.type, args.name)
