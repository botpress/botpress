/**
 *
 * @title Sends serialized data to parent page on channel web
 * @category Channel Web
 * @author Botpress, Inc.
 * @param {string} data - Serialized payload you want to send
 */
const sendPostbackToParent = async data => {
  if (event.channel != 'web') {
    return
  }

  const postbackEvent = bp.IO.Event({
    type: 'data',
    channel: 'web',
    direction: 'outgoing',
    target: event.target,
    botId: event.botId,
    payload: {
      data
    }
  })

  await bp.events.sendEvent(postbackEvent)
}

return sendPostbackToParent(args.data)
