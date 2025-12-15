import { ConversationMessageEvent } from 'src/messaging-events'
import { Client, CreateMessageInputPayload, CreateMessageInputType, Logger } from 'src/types'

export async function handleConversationMessage(
  event: ConversationMessageEvent,
  client: Client,
  logger: Logger
): Promise<void> {
  const payload = event.payload

  if (payload.message.author.type === 'business') {
    console.warn('Skipping message that is from a business')
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: payload.conversation?.id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: payload.message.author.userId,
    },
    name: payload.message.author.displayName || payload.message.author.user?.profile?.givenName,
    pictureUrl: payload.message.author.avatarUrl || payload.message.author.user?.profile?.avatarUrl,
  })

  const createMessage = async (type: CreateMessageInputType, messagePayload: CreateMessageInputPayload) => {
    await client.createMessage({
      tags: { id: payload.message.id },
      type,
      userId: user.id,
      conversationId: conversation.id,
      payload: messagePayload,
    })
  }

  const { content } = payload.message

  switch (content.type) {
    case 'text':
      if (!content.text?.length) {
        logger.forBot().warn('Text message received but no text provided')
        return
      }

      await createMessage('text', { text: content.text })
      break
    case 'image':
      await createMessage('image', { imageUrl: content.mediaUrl })
      break
    case 'file':
      const mediaType = content.mediaType || ''
      const mediaUrl = content.mediaUrl

      if (mediaType.startsWith('video/')) {
        await createMessage('video', { videoUrl: mediaUrl })
      } else if (mediaType.startsWith('audio/')) {
        await createMessage('audio', { audioUrl: mediaUrl })
      } else {
        await createMessage('file', { fileUrl: mediaUrl, title: content.altText })
      }
      break
    default:
      logger.forBot().warn(`Received a message with unsupported content type: ${content.type}`)
  }
}
