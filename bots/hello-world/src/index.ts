import * as bp from '.botpress'

const bot = new bp.Bot({})

bot.message(async ({ message, client, ctx }) => {
  console.info('Received message', message)

  await client.createMessage({
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text: 'Hello world!',
    },
  })

  console.info('text message sent')
})

export default bot
