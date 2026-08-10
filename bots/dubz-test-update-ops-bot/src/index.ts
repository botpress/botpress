import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})

bot.on.message('*', async ({ client, message, conversation, ctx, logger }) => {
  logger.info(`[bot] reacting to incoming message ${message.id}`)

  const { message: reply } = await client.createMessage({
    conversationId: conversation.id,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: { text: 'hello, I am about to edit myself...' },
  })

  // called with the bot's own credentials -> attributed as updatedBy: 'bot' -> fires message_updated
  await client.updateMessage({
    id: reply.id,
    payload: { text: 'hello, I was edited by the bot!' },
  })

  // conversation_updated is triggered separately, from the integration's own outgoing message handler -
  // bridge only emits it when the caller authenticates as an integration instance, not a bot
  logger.info(`[bot] edited message ${reply.id}`)
})

export default bot
