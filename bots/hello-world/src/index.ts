import * as qs from 'qs'
import * as bp from '.botpress'

const truncate = (str: string, maxLength: number = 500): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)}...` : str

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
