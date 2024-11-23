import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.hook.beforeIncomingEvent('*', async (x) => console.info('before_incoming_event', x.data))
plugin.hook.beforeIncomingMessage('*', async (x) => console.info('before_incoming_message', x.data))
plugin.hook.beforeOutgoingMessage('*', async (x) => console.info('before_outgoing_message', x.data))
plugin.hook.beforeOutgoingCallAction('*', async (x) => console.info('before_call_action', x.data))
plugin.hook.afterIncomingEvent('*', async (x) => console.info('after_incoming_event', x.data))
plugin.hook.afterIncomingMessage('*', async (x) => console.info('after_incoming_message', x.data))
plugin.hook.afterOutgoingMessage('*', async (x) => console.info('after_outgoing_message', x.data))
plugin.hook.afterOutgoingCallAction('*', async (x) => console.info('after_call_action', x.data))

export default plugin
