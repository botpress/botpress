import { createOrUpdateUser } from '@botpress/common'
import type { ZendeskClient } from '../client'
import type { TriggerPayload } from '../triggers'
import { retrieveHitlConversation } from './hitl-ticket-filter'
import * as bp from '.botpress'

export const executeMessageReceived = async ({
  zendeskClient,
  zendeskTrigger,
  client,
  ctx,
  logger,
}: {
  zendeskClient: ZendeskClient
  zendeskTrigger: TriggerPayload
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  const isSystemNotification = zendeskTrigger.currentUser.id === '-1'

  if (isSystemNotification) {
    logger.forBot().debug('Ignoring system notification message from Zendesk', {
      zendeskTrigger,
    })
    return
  }

  const conversation = await retrieveHitlConversation({
    zendeskTrigger,
    client,
    ctx,
    logger,
  })

  if (!conversation) {
    return
  }

  const isAlreadyDelivered = await _isMessageAlreadyDelivered({
    conversationId: conversation.id,
    zendeskCommentId: zendeskTrigger.commentId,
    client,
  })

  if (isAlreadyDelivered) {
    return
  }

  const { user } = await createOrUpdateUser({
    client,
    name: zendeskTrigger.currentUser.name,
    pictureUrl: zendeskTrigger.currentUser.remote_photo_url,
    tags: {
      id: zendeskTrigger.currentUser.id,
      email: zendeskTrigger.currentUser.email,
      role: zendeskTrigger.currentUser.role,
    },
    discriminateByTags: ['id'],
  })

  if (!zendeskTrigger.currentUser.externalId?.length) {
    await zendeskClient.updateUser(zendeskTrigger.currentUser.id, {
      external_id: user.id,
    })
  }

  const messageWithoutAuthor = zendeskTrigger.comment.split('\n').slice(3).join('\n')

  await client.createMessage({
    tags: { zendeskCommentId: zendeskTrigger.commentId },
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: messageWithoutAuthor },
  })
}

const _isMessageAlreadyDelivered = async ({
  conversationId,
  zendeskCommentId,
  client,
}: {
  conversationId: string
  zendeskCommentId: string
  client: bp.Client
}): Promise<boolean> => {
  if (!zendeskCommentId) {
    return false
  }

  const { messages } = await client.listMessages({ conversationId, tags: { zendeskCommentId } })

  return messages.length > 0
}
