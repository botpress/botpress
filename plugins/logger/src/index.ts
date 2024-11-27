import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

const log = (...x: any[]): undefined => {
  console.info(...x)
  return
}

plugin.hook.beforeIncomingEvent('*', async (x) => log('before_incoming_event', x.data))
plugin.hook.beforeIncomingMessage('*', async (x) => log('before_incoming_message', x.data))
plugin.hook.beforeOutgoingMessage('*', async (x) => log('before_outgoing_message', x.data))
plugin.hook.beforeOutgoingCallAction('*', async (x) => log('before_call_action', x.data))
plugin.hook.afterIncomingEvent('*', async (x) => log('after_incoming_event', x.data))
plugin.hook.afterIncomingMessage('*', async (x) => log('after_incoming_message', x.data))
plugin.hook.afterOutgoingMessage('*', async (x) => log('after_outgoing_message', x.data))
plugin.hook.afterOutgoingCallAction('*', async (x) => log('after_call_action', x.data))

export default plugin
