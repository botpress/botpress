import * as sdk from '@botpress/client'
import * as bp from '.botpress'

export const retrieveChannelAndMessageTs = async ({
  client,
  messageId,
  throwOnMissing = true,
}: {
  client: bp.Client
  messageId: string
  throwOnMissing?: boolean
}): Promise<{ channel: string; ts: string } | null> => {
  const { message } = await client.getMessage({ id: messageId })
  const { conversation } = await client.getConversation({ id: message.conversationId })

  const channel = conversation.tags.id
  const ts = message.tags.ts

  if (!channel) {
    if (!throwOnMissing) {
      return null
    }
    throw new sdk.RuntimeError('Channel ID is missing in conversation tags')
  }
  if (!ts) {
    if (!throwOnMissing) {
      return null
    }
    throw new sdk.RuntimeError('Timestamp is missing in message tags')
  }

  return { channel, ts }
}
