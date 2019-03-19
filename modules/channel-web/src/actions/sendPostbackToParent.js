/**
 *
 * @title Sends serialized data to parent page on channel web
 * @category Channel Web
 * @author Botpress, Inc.
 * @param {string} data - Serialized payload you want to send
 */
const sendPostbackToParent = data => {
  const postbackEvent = bp.IO.Event({
    type: 'postback',
    channel: 'web',
    direction: 'incoming',
    target: event.target,
    botId: event.botId,
    payload: {
      data
    }
  })

  postbackEvent.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
  bp.events.sendEvent(postbackEvent)
}

if (event.channel === 'web') {
  sendPostbackToParent(args.data)
}
