import type { Client } from '@botpress/client'
import { Bot, messages } from '@botpress/sdk'
import type { z } from 'zod'

type DefaultMessages = typeof messages.defaults
type DefaultMessageType = keyof DefaultMessages
type DefaultMessagePayload<T extends DefaultMessageType> = z.infer<DefaultMessages[T]['schema']>

type CreateMessageProps = Parameters<Client['createMessage']>[0]
type CreateMessageBody<T extends DefaultMessageType> = Omit<CreateMessageProps, 'type' | 'payload'> & {
  type: T
  payload: DefaultMessagePayload<T>
}

const bot = new Bot()

bot.message('', async ({ message, client, ctx }) => {
  console.info('Received message', message)

  await client.createMessage({
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text: 'Hello world!',
    },
  } satisfies CreateMessageBody<'text'>)

  console.info('text message sent')
})

export default bot
