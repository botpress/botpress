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

bot.hook.beforeIncomingEvent('*', async (x) => console.info('before_incoming_event', x.data))
bot.hook.beforeIncomingMessage('*', async (x) => console.info('before_incoming_message', x.data))
bot.hook.beforeOutgoingMessage('*', async (x) => console.info('before_outgoing_message', x.data))
bot.hook.beforeOutgoingCallAction('*', async (x) => console.info('before_call_action', x.data))
bot.hook.afterIncomingEvent('*', async (x) => console.info('after_incoming_event', x.data))
bot.hook.afterIncomingMessage('*', async (x) => console.info('after_incoming_message', x.data))
bot.hook.afterOutgoingMessage('*', async (x) => console.info('after_outgoing_message', x.data))
bot.hook.afterOutgoingCallAction('*', async (x) => console.info('after_call_action', x.data))

bot.message('*', async (props) => {
  const { message, client, ctx, self } = props

  const { message: response } = await self.actionHandlers.sayHello({ ...props, input: {} })
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

bot.event('webhook:event', async ({ event }) => {
  const { body, method, path, query } = event.payload
  const queryString = qs.stringify(query)
  const fullPath = queryString ? `${path}?${queryString}` : path
  const debug = truncate(`${method} ${fullPath} ${JSON.stringify(body)}`)
  console.debug('Received webhook request:', debug)
})

export default bot
