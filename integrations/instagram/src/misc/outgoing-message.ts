import { MessengerClient } from 'messaging-api-messenger'
import { idTag } from 'src/const'
import { getMessengerClient } from './utils'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack'>

export async function sendMessage(
  { ack, ctx, conversation }: SendMessageProps,
  send: (client: MessengerClient, recipientId: string) => Promise<{ messageId: string }>
) {
  const messengerClient = getMessengerClient(ctx.configuration)
  const recipientId = getRecipientId(conversation)
  await send(messengerClient, recipientId)
  await ack({
    tags: {
      // TODO: declare in definition
      // [idTag]: messageId,
    },
  })
}

function getRecipientId(conversation: SendMessageProps['conversation']): string {
  const recipientId = conversation.tags[idTag]

  if (!recipientId) {
    throw Error(`No recipient id found for user ${conversation.id}`)
  }

  return recipientId
}
