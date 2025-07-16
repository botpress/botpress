import * as sdk from '@botpress/sdk'
import { isBrowser } from 'browser-or-node'
import * as actions from './actions'
import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    startHitl: async (props) => {
      if (isBrowser) {
        throw new sdk.RuntimeError('HITL is not supported in the browser')
      }
      return await actions.startHitl(props)
    },
    stopHitl: async (props) => {
      if (isBrowser) {
        throw new sdk.RuntimeError('HITL is not supported in the browser')
      }
      return await actions.stopHitl(props)
    },
  },
})

plugin.on.beforeIncomingMessage('*', async (props) => {
  if (isBrowser) {
    props.logger.warn('HITL is not supported in the browser')
    return
  }
  props.logger.info('Before incoming message', props.data.payload)
  return await hooks.beforeIncomingMessage.all.handleMessage(props)
})

plugin.on.beforeIncomingEvent('hitl:hitlAssigned', async (props) => {
  if (isBrowser) {
    props.logger.warn('HITL is not supported in the browser')
    return
  }
  props.logger.info('HITL assigned', props.data.payload)
  return await hooks.beforeIncomingEvent.hitlAssigned.handleEvent(props)
})

plugin.on.beforeIncomingEvent('hitl:hitlStopped', async (props) => {
  if (isBrowser) {
    props.logger.warn('HITL is not supported in the browser')
    return
  }
  props.logger.info('HITL stopped', props.data.payload)
  return await hooks.beforeIncomingEvent.hitlStopped.handleEvent(props)
})

plugin.on.beforeIncomingEvent('humanAgentAssignedTimeout', async (props) => {
  if (isBrowser) {
    props.logger.warn('HITL is not supported in the browser')
    return
  }
  props.logger.info('HITL agent assigned timeout', props.data.payload)
  return await hooks.beforeIncomingEvent.humanAgentAssignedTimeout.handleEvent(props)
})

plugin.on.beforeIncomingEvent('*', async (props) => {
  if (isBrowser) {
    return
  }
  props.logger.info('Before incoming event', props.data.payload)
  return await hooks.beforeIncomingEvent.all.handleEvent(props)
})

export default plugin
