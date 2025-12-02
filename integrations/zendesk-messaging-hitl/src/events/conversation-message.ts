import { ConversationMessageEvent } from 'src/sunshine-events'
import {
  Client,
  Conversation,
  CreateMessageInput,
  CreateMessageInputPayload,
  CreateMessageInputType,
  Logger,
} from 'src/types'

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
    } as CreateMessageInput)
  }

  if (messageContent.type === 'text') {
    await createMessage('text', { text: messageContent.text || '' })
  } else if (messageContent.type === 'image') {
    await createMessage('image', { imageUrl: messageContent.mediaUrl || '' })
  } else if (messageContent.type === 'file') {
    const mediaType = messageContent.mediaType || ''
    const mediaUrl = messageContent.mediaUrl || ''

    if (mediaType.startsWith('video/')) {
      await createMessage('video', { videoUrl: mediaUrl })
    } else if (mediaType.startsWith('audio/')) {
      await createMessage('audio', { audioUrl: mediaUrl })
    } else {
      await createMessage('file', { fileUrl: mediaUrl, title: messageContent.altText })
    }
  } else {
    logger.forBot().warn(`Received a message with unsupported content type: ${messageContent.type}`)
  }
}
