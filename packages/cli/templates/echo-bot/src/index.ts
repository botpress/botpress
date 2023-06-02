import type { Client } from '@botpress/client'
import { Bot, messages } from '@botpress/sdk'
import type { z } from 'zod'
// import * as botpress from '.botpress' /** uncomment to get generated code */

type DefaultMessages = typeof messages.defaults
type DefaultMessageType = keyof DefaultMessages
type DefaultMessagePayload<T extends DefaultMessageType> = z.infer<DefaultMessages[T]['schema']>

type CreateMessageProps = Parameters<Client['createMessage']>[0]
type CreateMessageBody<T extends DefaultMessageType> = Omit<CreateMessageProps, 'type' | 'payload'> & {
  type: T
  payload: DefaultMessagePayload<T>
}

const logger = console

const bot = new Bot({
  integrations: [],
  configuration: {
    schema: {},
  },
  states: {},
  events: {},
  recurringEvents: {},
})

bot.message('', async ({ message, client, ctx }) => {
  logger.info('Received message', message)

  await client.createMessage({
    conversationId: message.conversationId,
    userId: ctx.botId,
    tags: {},
    type: 'text',
    payload: {
      text: `You said: ${message.payload.text}`,
    },
  } satisfies CreateMessageBody<'text'>)

  logger.info('text message sent')
})

export default bot
