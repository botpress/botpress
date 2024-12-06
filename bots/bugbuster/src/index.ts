import { bot } from './bot'
import { handleNewIssue, handleSyncIssuesRequest } from './handlers'
import { listIssues } from './list-issues'
import * as listeners from './listeners'
import * as bp from '.botpress'

bot.on.event('github:issueOpened', handleNewIssue)
bot.on.event('syncIssuesRequest', handleSyncIssuesRequest)

const respond = async (props: bp.MessageHandlerProps, text: string) => {
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

bot.on.message('*', async (props) => {
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
  } else if (message.type === 'text' && message.payload.text === '#list') {
    const githubIssues = await listIssues(props)
    const message = ['Here are the issues in GitHub:', ...githubIssues.map((i) => `\t${i.displayName}`)].join('\n')
    return await respond(props, message)
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
