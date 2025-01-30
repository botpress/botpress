import * as actions from './actions'
import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    startHitl: actions.startHitl,
    stopHitl: actions.stopHitl,
  },
})

plugin.on.beforeIncomingMessage('*', hooks.handleMessage)

plugin.on.event('hitl:hitlAssigned', async ({ event }) => {
  console.info('HITL assigned', event.payload)
})

plugin.on.event('hitl:hitlStopped', async ({ event, ...props }) => {
  console.info('HITL stopped', event.payload)
  await actions.stopHitl({
    ...props,
    input: {
      conversationId: event.payload.conversationId,
    },
  })
})

export default plugin
