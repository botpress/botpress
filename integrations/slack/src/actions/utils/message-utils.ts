import * as sdk from '@botpress/client'
import * as bp from '.botpress'

export const retrieveChannelAndMessageTs = async ({ client, messageId }: { client: bp.Client; messageId: string }) => {
  const { message } = await client.getMessage({ id: messageId })
  const { conversation } = await client.getConversation({ id: message.conversationId })

  const channel = conversation.tags.id
  const ts = message.tags.ts
  if (!channel) {
    throw new sdk.RuntimeError('Channel ID is missing in conversation tags')
  }
  if (!ts) {
    throw new sdk.RuntimeError('Timestamp is missing in message tags')
  }

  return { channel, ts }
}
