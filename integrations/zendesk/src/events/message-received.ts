import { createOrUpdateUser } from '@botpress/common'
import _ from 'lodash'
import type { ZendeskClient } from '../client'
import type { TriggerPayload } from '../triggers'
import { retrieveHitlConversation } from './hitl-ticket-filter'
import * as bp from '.botpress'

const ON_BEHALF_REGEXP: RegExp = /!\*{3}|\*{3}!/

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

  let messageWithoutAuthor = _.trimStart(zendeskTrigger.comment, '-').trim()
  const firstLine = messageWithoutAuthor.split('\n').at(0)

  if (firstLine && ON_BEHALF_REGEXP.test(firstLine)) {
    messageWithoutAuthor = messageWithoutAuthor.split('\n').slice(1).join('\n').trim()
  }

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
