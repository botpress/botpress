import * as bp from '.botpress'
import { getCredentials, MetaClient } from './client'
import { RuntimeError } from '@botpress/client'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack' | 'client' | 'logger'>

export async function sendMessage(
  { ack, ctx, client, conversation, logger }: SendMessageProps,
  send: (client: MetaClient, toInstagramId: string) => Promise<{ message_id: string }>
) {
  console.log('Will send message')

  const { accessToken, instagramId } = await getCredentials(client, ctx)
  const metaClient = new MetaClient(logger, { accessToken, instagramId })
  const recipientId = getRecipientId(conversation)

  console.log({ recipientId })

  const { message_id } = await send(metaClient, recipientId)

  console.log({ message_id })

  await ack({
    tags: {
      id: message_id,
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
