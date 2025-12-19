import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {
    sayHello: async ({ input }) => {
      const name = input?.name || 'World'
      return { message: `Hello, ${name}!` }
    },
  },
})

bot.on.message('*', async (props) => {
  const { conversation, message, client, ctx, logger } = props

  if (conversation.integration !== 'tele') {
    logger.error(`Received message from unsupported integration: ${conversation.integration}`)
    return
  }

  const { message: response } = await bot.actionHandlers.sayHello({ ...props, input: {} })
  await client.createMessage({
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text: response,
    },
  })
})

export default bot
