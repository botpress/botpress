import { RuntimeError } from '@botpress/client'
import { getCredentials, InstagramClient } from './client'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack' | 'client' | 'logger'>

export async function sendMessage(
  { ack, ctx, client, conversation, logger }: SendMessageProps,
  send: (client: InstagramClient, toInstagramId: string) => Promise<{ message_id: string }>
) {
  const { accessToken, instagramId } = await getCredentials(client, ctx)
  const metaClient = new InstagramClient(logger, { accessToken, instagramId })
  const recipientId = getRecipientId(conversation)

  const { message_id } = await send(metaClient, recipientId)

  await ack({
    tags: {
      id: message_id,
      senderId: instagramId,
      recipientId,
    },
  })
}

function getRecipientId(conversation: SendMessageProps['conversation']): string {
  const recipientId = conversation.tags.id

  if (!recipientId) {
    throw new RuntimeError(`No recipient id found for user ${conversation.id}`)
  }

  return recipientId
}
