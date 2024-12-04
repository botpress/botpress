import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

const log = (...x: any[]): undefined => {
  console.info(...x)
  return
}

plugin.on.beforeIncomingEvent('*', async (x) => log('before_incoming_event', x.data))
plugin.on.beforeIncomingMessage('*', async (x) => log('before_incoming_message', x.data))
plugin.on.beforeOutgoingMessage('*', async (x) => log('before_outgoing_message', x.data))
plugin.on.beforeOutgoingCallAction('*', async (x) => log('before_call_action', x.data))
plugin.on.afterIncomingEvent('*', async (x) => log('after_incoming_event', x.data))
plugin.on.afterIncomingMessage('*', async (x) => log('after_incoming_message', x.data))
plugin.on.afterOutgoingMessage('*', async (x) => log('after_outgoing_message', x.data))
plugin.on.afterOutgoingCallAction('*', async (x) => log('after_call_action', x.data))

export default plugin
