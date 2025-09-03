import * as qs from 'qs'
import * as bp from '.botpress'

const truncate = (str: string, maxLength: number = 500): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)}...` : str

const bot = new bp.Bot({
  actions: {
    sayHello: async ({ input }) => {
      const name = input?.name || 'World'
      return { message: `Hello, ${name}!` }
    },
  },
})

bot.on.message('*', async (props) => {
  const { message, client, ctx } = props

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

bot.on.event('webhook:event', async ({ event }) => {
  const { body, method, path, query } = event.payload
  const queryString = qs.stringify(query)
  const fullPath = queryString ? `${path}?${queryString}` : path
  const debug = truncate(`${method} ${fullPath} ${JSON.stringify(body)}`)
  console.debug('Received webhook request:', debug)
})

export default bot
