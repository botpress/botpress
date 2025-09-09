import { isBrowser } from 'browser-or-node'
import * as onNewMessageHandler from './onNewMessageHandler'
import * as summaryUpdater from './tagsUpdater'
import * as types from './types'
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
  await _updateAllConversations(props)

  return undefined
})

plugin.on.workflowContinue('updateAllConversations', async (props) => {
  await _updateAllConversations(props)

  return undefined
})

plugin.on.workflowTimeout('updateAllConversations', async (props) => {
  props.logger.error('Workflow timed out')
})

type WorkflowProps = types.CommonProps & bp.WorkflowHandlerProps['updateAllConversations']
const _updateAllConversations = async (props: WorkflowProps) => {
  const dirtyConversations = await props.client.listConversations({ tags: { isDirty: 'true' } })

  const promises: Promise<void>[] = []
  for (const conversation of dirtyConversations.conversations) {
    const firstMessagePage = await props.client
      .listMessages({ conversationId: conversation.id })
      .then((res) => res.messages)
    const promise = summaryUpdater.updateTitleAndSummary({ ...props, conversation, messages: firstMessagePage })
    promises.push(promise)
  }

  await Promise.all(promises)
  await props.workflow.setCompleted()
  props.logger.info('updateAllConversations workflow completed')
}

export default plugin
