/**
 *
 * @title Sends code to be executed in the web channel page
 * @category Channel Web
 * @author Botpress, Inc.
 * @param {string} code - Javascript code in string format, it has access to the 'store' variable as well https://github.com/botpress/botpress/blob/master/modules/channel-web/src/views/lite/store/index.ts
 */
const sendRemoteCode = async code => {
  if (event.channel != 'web') {
    return
  }

  const remoteCodeEvent = bp.IO.Event({
    type: 'data',
    channel: 'web',
    direction: 'outgoing',
    target: event.target,
    botId: event.botId,
    payload: {
      execute: '(function ({ store }) {' + code + '})(arguments[0])'
    }
  })

  await bp.events.sendEvent(remoteCodeEvent)
}

return sendRemoteCode(args.code)
