/**
 * Delete data to desired storage. Read the
 * documentation for more details
 *
 * @title Delete Variable
 * @category Storage
 * @author Botpress, Inc.
 * @param {string} type - Pick between: user, session, temp, bot
 * @param {string} name - The name of the variable
 */
const setVariable = async (type, name) => {
  if (type === 'bot') {
    const original = await bp.kvs.forBot(event.botId).get('global')
    await bp.kvs.forBot(event.botId).set('global', { ...original, [name]: '' })
  } else {
    delete event.state[type][name]
  }
}

return setVariable(args.type, args.name)
