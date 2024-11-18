import * as qs from 'qs'
import * as bp from '.botpress'

const truncate = (str: string, maxLength: number = 500): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)}...` : str

const bot = new bp.Bot({})

bot.hook.before_incoming_event('*', async (x) => console.info('before_incoming_event', x.data))
bot.hook.before_incoming_message('*', async (x) => console.info('before_incoming_message', x.data))
bot.hook.before_outgoing_message('*', async (x) => console.info('before_outgoing_message', x.data))
bot.hook.before_call_action('*', async (x) => console.info('before_call_action', x.data))
bot.hook.after_incoming_event('*', async (x) => console.info('after_incoming_event', x.data))
bot.hook.after_incoming_message('*', async (x) => console.info('after_incoming_message', x.data))
bot.hook.after_outgoing_message('*', async (x) => console.info('after_outgoing_message', x.data))
bot.hook.after_call_action('*', async (x) => console.info('after_call_action', x.data))

bot.message(async ({ message, client, ctx }) => {
  await client.createMessage({
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text: 'Hello world!',
    },
  })
})

bot.event(async ({ event }) => {
  if (event.type === 'webhook:event') {
    const { body, method, path, query } = event.payload
    const queryString = qs.stringify(query)
    const fullPath = queryString ? `${path}?${queryString}` : path
    const debug = truncate(`${method} ${fullPath} ${JSON.stringify(body)}`)
    console.debug('Received webhook request:', debug)
  }
})

export default bot
