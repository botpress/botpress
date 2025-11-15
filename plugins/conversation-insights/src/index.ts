import { isBrowser } from 'browser-or-node'
import * as onNewMessageHandler from './onNewMessageHandler'
import { updateAllConversations } from './updateAllConversations'
import * as bp from '.botpress'

const HOUR_MILLISECONDS = 60 * 60 * 1000

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.afterIncomingMessage('*', async (props) => {
  if (isBrowser) {
    return
  }
  const { conversation } = await props.client.getConversation({ id: props.data.conversationId })
  await onNewMessageHandler.onNewMessage({ ...props, conversation })

  if (props.configuration.aiEnabled) {
    const eventType = `${props.alias}#updateAiInsight`
    const events = await props.client.listEvents({ type: eventType, status: 'scheduled' })

    if (events.events.length === 0) {
      const dateTime = new Date(Date.now() + HOUR_MILLISECONDS).toISOString()
      await props.events.updateAiInsight.schedule({}, { dateTime })
    }
  }

  return undefined
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  if (isBrowser) {
    return
  }
  const { conversation } = await props.client.getConversation({ id: props.data.message.conversationId })
  await onNewMessageHandler.onNewMessage({ ...props, conversation })
  return undefined
})

plugin.on.event('updateAiInsight', async (props) => {
  if (isBrowser) {
    props.logger.error('This event is not supported by the browser')
    return
  }

  const workflows = await props.client.listWorkflows({
    name: 'updateAllConversations',
    statuses: ['in_progress', 'listening', 'pending'],
  })

  if (workflows.workflows.length === 0) {
    await props.workflows.updateAllConversations.startNewInstance({ input: {} })
  }
})

plugin.on.workflowStart('updateAllConversations', async (props) => {
  props.logger.info('Starting updateAllConversations workflow')
  await updateAllConversations(props)

  return undefined
})

plugin.on.workflowContinue('updateAllConversations', async (props) => {
  await updateAllConversations(props)

  return undefined
})

plugin.on.workflowTimeout('updateAllConversations', async (props) => {
  await props.workflow.setFailed({ failureReason: 'Workflow timed out' })
})

export default plugin
