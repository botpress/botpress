import * as bp from '.botpress'
import { ChatwootWebhookPayload, chatwootWebhookPayloadSchema } from '../misc/types'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, logger }) => {
  const payload = chatwootWebhookPayloadSchema.parse(JSON.parse(req.body || '{}'))

  if (payload.event === 'conversation_status_changed' && payload.status === 'resolved' && payload.id) {
    await handleConversationResolvedById(payload.id.toString(), client, logger)
    return
  }

  if (payload.event !== 'message_created') return

  // message_type: 0/"incoming" or 1/"outgoing" - string for API calls, number for webhooks
  const isOutgoing = payload.message_type === 1 || payload.message_type === 'outgoing'
  const isIncoming = payload.message_type === 0 || payload.message_type === 'incoming'

  if (isOutgoing) {
    const chatwootConvId = payload.conversation?.id?.toString()
    if (!chatwootConvId) return

    const hitlConv = await findHitlConversation(client, chatwootConvId, logger)
    if (!hitlConv) return

    await handleHitlMessage(payload, client, hitlConv)
  } else if (isIncoming) {
    await handleMessagingChannelMessage(payload, client)
  }
}

async function handleConversationResolvedById(chatwootConvId: string, client: bp.Client, logger: bp.Logger) {
  const hitlConv = await findHitlConversation(client, chatwootConvId, logger)
  if (!hitlConv) return

  await client.createEvent({
    type: 'hitlStopped',
    payload: { conversationId: hitlConv.id },
  })
}

async function findHitlConversation(client: bp.Client, chatwootConvId: string, logger: bp.Logger) {
  const { conversations } = await client.listConversations({
    tags: { id: chatwootConvId },
  })
  const hitlConv = conversations.find((c) => c.tags?.bpUserId)
  if (!hitlConv) {
    logger.forBot().error(`No hitl conversation found for chatwoot conversation ${chatwootConvId}`)
  }
  return hitlConv
}

async function handleHitlMessage(
  payload: ChatwootWebhookPayload,
  client: bp.Client,
  hitlConv: { id: string; tags?: Record<string, string> }
) {
  const chatwootConvId = payload.conversation?.id?.toString()
  if (!chatwootConvId) return

  const { user: agentUser } = await client.getOrCreateUser({
    tags: { chatwootAgentId: payload.sender?.id?.toString() || 'unknown' },
    name: payload.sender?.name || 'Agent',
  })

  await createBotpressMessages(client, payload, hitlConv.id, agentUser.id, chatwootConvId)
}

async function handleMessagingChannelMessage(payload: ChatwootWebhookPayload, client: bp.Client) {
  const chatwootConvId = payload.conversation?.id?.toString()
  if (!chatwootConvId) {
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: { id: chatwootConvId },
  })

  const { user: contactUser } = await client.getOrCreateUser({
    tags: { chatwootContactId: payload.sender?.id?.toString() || 'unknown' },
    name: payload.sender?.name || 'Contact',
  })

  await createBotpressMessages(client, payload, conversation.id, contactUser.id, chatwootConvId)
}

async function createBotpressMessages(
  client: bp.Client,
  payload: ChatwootWebhookPayload,
  conversationId: string,
  userId: string,
  chatwootConvId: string
) {
  if (payload.content?.trim()) {
    await client.createMessage({
      conversationId,
      userId,
      type: 'text',
      payload: { text: payload.content },
      tags: { id: payload.id?.toString() || '', conversationId: chatwootConvId },
    })
  }

  if (payload.attachments?.length) {
    for (const attachment of payload.attachments) {
      const baseTags = { id: payload.id?.toString() || '', conversationId: chatwootConvId }
      const attachmentUrl = attachment.data_url || attachment.file_url
      if (!attachmentUrl) continue

      switch (attachment.file_type) {
        case 'image':
          await client.createMessage({
            conversationId,
            userId,
            type: 'image',
            payload: { imageUrl: attachmentUrl },
            tags: baseTags,
          })
          break
        case 'video':
          await client.createMessage({
            conversationId,
            userId,
            type: 'video',
            payload: { videoUrl: attachmentUrl },
            tags: baseTags,
          })
          break
        case 'file':
          await client.createMessage({
            conversationId,
            userId,
            type: 'file',
            payload: { fileUrl: attachmentUrl, title: attachment.filename || 'File' },
            tags: baseTags,
          })
          break
      }
    }
  }
}
