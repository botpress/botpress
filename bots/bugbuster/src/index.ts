import { MessageHandlerProps, bot } from './bot'
import { handleNewIssue, handleSyncIssuesRequest } from './handlers'
import * as listeners from './listeners'

bot.event(async (props) => {
  const { event } = props
  if (event.type === 'github:issueOpened') {
    return handleNewIssue(props, event)
  }

  if (event.type === 'syncIssuesRequest') {
    return handleSyncIssuesRequest(props, event)
  }
})

const respond = async (props: MessageHandlerProps, text: string) => {
  const { client, ctx, message } = props
  await client.createMessage({
    type: 'text',
    payload: {
      text,
    },
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
  })
}

bot.message(async (props) => {
  const { conversation, message, client, ctx } = props
  if (conversation.integration !== 'slack') {
    console.info(`Ignoring message from ${conversation.integration}`)
    return
  }

  if (message.type === 'text' && message.payload.text === '#start_listening') {
    const state = await listeners.readListeners(props)
    if (!state.conversationIds.includes(message.conversationId)) {
      state.conversationIds.push(message.conversationId)
      await listeners.writeListeners(props, state)
      return await respond(props, 'You will now receive notifications.')
    } else {
      return await respond(props, 'Already listening.')
    }
  } else if (message.type === 'text' && message.payload.text === '#stop_listening') {
    const state = await listeners.readListeners(props)
    state.conversationIds = state.conversationIds.filter((id) => id !== message.conversationId)
    await listeners.writeListeners(props, state)
    return await respond(props, 'Stopped listening.')
  }

  await client.createMessage({
    type: 'text',
    payload: {
      text: "Hi, I'm BugBuster. I can't help you.",
    },
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
  })
})

export default bot
