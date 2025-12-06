import { ConversationMessageEvent } from 'src/sunshine-events'
import { Client, Conversation, CreateMessageInputPayload, CreateMessageInputType, Logger } from 'src/types'

export async function handleConversationMessage(
  event: ConversationMessageEvent,
  conversation: Conversation,
  client: Client,
  logger: Logger
): Promise<void> {
  const payload = event.payload

  // Agent messages will come as business
  if (payload.message.author.type !== 'business') {
    return
  }

  const zendeskAgentId: string | undefined = payload.message?.metadata?.['__zendesk_msg.agent.id']

  if (!zendeskAgentId?.length) {
    return
  }

  const { user } = await client.getOrCreateUser({
    tags: {
      id: zendeskAgentId,
    },
    name: payload.message.author.displayName,
    pictureUrl: payload.message.author.avatarUrl,
  })

  const messageContent = payload.message.content

  const createMessage = async (type: CreateMessageInputType, messagePayload: CreateMessageInputPayload) => {
    await client.createMessage({
      tags: { id: payload.message.id },
      type,
      userId: user.id,
      conversationId: conversation.id,
      payload: messagePayload,
    })
  }

  switch (messageContent.type) {
    case 'text':
      if (!messageContent.text?.length) {
        logger.forBot().warn('Text message received but no text provided')
        return
      }

      await createMessage('text', { text: messageContent.text })
      break
    case 'image':
      await createMessage('image', { imageUrl: messageContent.mediaUrl })
      break
    case 'file':
      const mediaType = messageContent.mediaType || ''
      const mediaUrl = messageContent.mediaUrl

      if (mediaType.startsWith('video/')) {
        await createMessage('video', { videoUrl: mediaUrl })
      } else if (mediaType.startsWith('audio/')) {
        await createMessage('audio', { audioUrl: mediaUrl })
      } else {
        await createMessage('file', { fileUrl: mediaUrl, title: messageContent.altText })
      }
      break
    default:
      logger.forBot().warn(`Received a message with unsupported content type: ${messageContent.type}`)
  }
}
