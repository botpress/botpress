import * as sdk from '@botpress/sdk'
import { isBrowser } from 'browser-or-node'
import * as updateScheduler from './summaryUpdateScheduler'
import * as summaryUpdater from './tagsUpdater'
import * as types from './types'
import * as bp from '.botpress'

type CommonProps = types.CommonProps

const HOUR_MILLISECONDS = 60 * 60 * 1000

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.afterIncomingMessage('*', async (props) => {
  if (isBrowser) {
    return
  }
  const { conversation } = await props.client.getConversation({ id: props.data.conversationId })
  const { message_count } = await _onNewMessage({ ...props, conversation })

  if (props.configuration.aiEnabled) {
    const eventType = 'conversation-insights#updateAiInsight'
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
  await _onNewMessage({ ...props, conversation })
  return undefined
})

type OnNewMessageProps = CommonProps & {
  conversation: bp.ClientOutputs['getConversation']['conversation']
}
const _onNewMessage = async (
  props: OnNewMessageProps
): Promise<{ message_count: number; participant_count: number }> => {
  const message_count = props.conversation.tags.message_count ? parseInt(props.conversation.tags.message_count) + 1 : 1

  const participant_count = await props.client
    .listParticipants({ id: props.conversation.id })
    .then(({ participants }) => participants.length)

  const tags = {
    message_count: message_count.toString(),
    participant_count: participant_count.toString(),
    isDirty: 'true',
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags,
  })
  return { message_count, participant_count }
}

plugin.on.event('updateAiInsight', async (props) => {
  if (isBrowser) {
    props.logger.error('This event is not supported by the browser')
    return
  }

  const workflows = await props.client
    .listWorkflows({ name: 'conversation-insights#updateAllConversations' })
    .then((workflows) => {
      return workflows.workflows.filter((workflow) => {
        !['cancelled', 'failed'].includes(workflow.status)
      })
    })

  if (workflows.length === 0) {
    props.workflows.updateAllConversations.startNewInstance({ input: {} })
  }
})

plugin.on.workflowStart('updateAllConversations', async (props) => {
  return undefined
})

plugin.on.workflowContinue('updateAllConversations', async (props) => {
  const dirtyConversations = await props.client.listConversations({ tags: { isDirty: 'true' } })

  const promises = []
  for (const conversation of dirtyConversations.conversations) {
    const firstMessagePage = await props.client
      .listMessages({ conversationId: props.event.conversationId })
      .then((res) => res.messages)
    promises.push(summaryUpdater.updateTitleAndSummary({ ...props, conversation, messages: firstMessagePage }))
  }

  await Promise.all(promises)
  await props.workflow.setCompleted()

  return undefined
})

plugin.on.workflowTimeout('updateAllConversations', async (props) => {
  props.logger.error('Workflow timed out')
})

export default plugin
