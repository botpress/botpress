import * as qs from 'qs'
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
  const result = await props.client.callAction({
    type: 'hubspot:searchLead',
    input: {
      // email: 'test@test.com',
      name: 'Andrew',
    },
  })

  await props.client.createMessage({
    payload: {
      text: JSON.stringify(result),
    },
    type: 'text',
    userId: props.ctx.botId,
    conversationId: props.conversation.id,
    tags: {},
  })

  console.log(result)
})

export default bot
