import * as actions from './actions'
import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    startHitl: actions.startHitl,
    stopHitl: actions.stopHitl,
  },
})

plugin.on.beforeIncomingMessage('*', async (props) => {
  console.info('Before incoming message', props.data.payload)
  return await hooks.beforeIncomingMessage.all.handleMessage(props)
})

plugin.on.beforeIncomingEvent('hitl:hitlAssigned', async (props) => {
  console.info('HITL assigned', props.data.payload)
  return await hooks.beforeIncomingEvent.hitlAssigned.handleEvent(props)
})

plugin.on.beforeIncomingEvent('hitl:hitlStopped', async (props) => {
  console.info('HITL stopped', props.data.payload)
  return await hooks.beforeIncomingEvent.hitlStopped.handleEvent(props)
})

plugin.on.event('humanAgentAssignedTimeout', async (props) => {
  console.info('HITL agent assigned timeout', props.event.payload)
  return await hooks.onEvent.humanAgentAssignedTimeout.handleEvent(props)
})

export default plugin
