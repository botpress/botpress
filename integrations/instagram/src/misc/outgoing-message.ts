import { MessengerClient } from 'messaging-api-messenger'
import { getMessengerClient } from './utils'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack' | 'client'>

export async function sendMessage(
  { ack, ctx, client, conversation }: SendMessageProps,
  send: (client: MessengerClient, recipientId: string) => Promise<{ messageId: string }>
) {
  const messengerClient = await getMessengerClient(client, ctx)
  const recipientId = getRecipientId(conversation)
  const message = await send(messengerClient, recipientId)
  await ack({
    tags: {
      id: message.messageId,
    },
  })
}

function getRecipientId(conversation: SendMessageProps['conversation']): string {
  const recipientId = conversation.tags.id

  if (!recipientId) {
    throw Error(`No recipient id found for user ${conversation.id}`)
  }

  return recipientId
}
