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
  const conversation = await props.conversations['*']['*'].getById({ id: props.data.conversationId })
  await onNewMessageHandler.onNewMessage({ ...props, conversation })

  if (props.configuration.aiEnabled) {
    const events = await props.events.updateAiInsight.list().take(1)

    if (events.length === 0) {
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
  const conversation = await props.conversations['*']['*'].getById({ id: props.data.message.conversationId })
  await onNewMessageHandler.onNewMessage({ ...props, conversation })
  return undefined
})

plugin.on.event('updateAiInsight', async (props) => {
  if (isBrowser) {
    props.logger.error('This event is not supported by the browser')
    return
  }

  const workflows = await props.workflows.updateAllConversations
    .listInstances({ statuses: ['pending', 'cancelled', 'listening', 'paused'] })
    .take(1)

  if (workflows.length === 0) {
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
