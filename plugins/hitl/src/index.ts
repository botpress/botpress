import * as actions from './actions'
import * as events from './events'
import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    startHitl: actions.startHitl,
    stopHitl: actions.stopHitl,
  },
})

plugin.on.beforeIncomingMessage('*', async (props) => {
  console.info('Before incoming message', props)
  return await hooks.handleMessage(props)
})

plugin.on.event('hitl:hitlAssigned', async (props) => {
  console.info('HITL assigned', props.event.payload)
})

plugin.on.event('hitl:hitlStopped', async (props) => {
  console.info('HITL stopped', props.event.payload)
  return await events.handleHitlStopped(props)
})

export default plugin
