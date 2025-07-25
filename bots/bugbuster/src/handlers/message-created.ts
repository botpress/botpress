import * as utils from '../utils'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']

export const handleMessageCreated: bp.MessageHandlers['*'] = async (props) => {
  const { conversation, message, client, ctx } = props
  if (!MESSAGING_INTEGRATIONS.includes(conversation.integration)) {
    props.logger.info(`Ignoring message from ${conversation.integration}`)
    return
  }

  const botpress = await utils.botpress.BotpressApi.create(props)

  if (message.type === 'text' && message.payload.text === '#start_listening') {
    const state = await botpress.readListeners()
    if (!state.conversationIds.includes(message.conversationId)) {
      state.conversationIds.push(message.conversationId)
      await botpress.writeListeners(state)
      return await botpress.respondText(props.conversation.id, 'You will now receive notifications.')
    } else {
      return await botpress.respondText(props.conversation.id, 'Already listening.')
    }
  } else if (message.type === 'text' && message.payload.text === '#stop_listening') {
    const state = await botpress.readListeners()
    state.conversationIds = state.conversationIds.filter((id) => id !== message.conversationId)
    await botpress.writeListeners(state)
    return await botpress.respondText(props.conversation.id, 'Stopped listening.')
  } else if (message.type === 'text' && message.payload.text === '#list') {
    const githubIssues = await botpress.listGithubIssues()
    const message = ['Here are the issues in GitHub:', ...githubIssues.map((i) => `\t${i.displayName}`)].join('\n')
    return await botpress.respondText(props.conversation.id, message)
  } else if (message.type === 'text' && message.payload.text === '#help') {
    const helpMessage = [
      'Here are the commands you can use:',
      '- `#start_listening`: Start receiving notifications for new issues.',
      '- `#stop_listening`: Stop receiving notifications.',
      '- `#list`: List all issues in GitHub.',
      '- `#help`: Show this help message.',
    ].join('\n')
    return await botpress.respondText(props.conversation.id, helpMessage)
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
}
