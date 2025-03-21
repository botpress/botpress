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
  props.logger.info('Before incoming message', props.data.payload)
  return await hooks.beforeIncomingMessage.all.handleMessage(props)
})

plugin.on.beforeIncomingEvent('hitl:hitlAssigned', async (props) => {
  props.logger.info('HITL assigned', props.data.payload)
  return await hooks.beforeIncomingEvent.hitlAssigned.handleEvent(props)
})

plugin.on.beforeIncomingEvent('hitl:hitlStopped', async (props) => {
  props.logger.info('HITL stopped', props.data.payload)
  return await hooks.beforeIncomingEvent.hitlStopped.handleEvent(props)
})

plugin.on.beforeIncomingEvent('humanAgentAssignedTimeout', async (props) => {
  props.logger.info('HITL agent assigned timeout', props.data.payload)
  return await hooks.beforeIncomingEvent.humanAgentAssignedTimeout.handleEvent(props)
})

plugin.on.beforeIncomingEvent('*', async (props) => {
  props.logger.info('Before incoming event', props.data.payload)
  return await hooks.beforeIncomingEvent.all.handleEvent(props)
})

export default plugin
