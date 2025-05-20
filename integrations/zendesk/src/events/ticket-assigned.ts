import { createOrUpdateUser } from '@botpress/common'
import type { TriggerPayload } from 'src/triggers'
import { retrieveHitlConversation } from './hitl-ticket-filter'
import * as bp from '.botpress'

export const executeTicketAssigned = async ({
  zendeskTrigger,
  client,
  ctx,
  logger,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  const conversation = await retrieveHitlConversation({
    zendeskTrigger,
    client,
    ctx,
    logger,
  })

  if (!conversation) {
    return
  }

  const { agent } = zendeskTrigger

  const { user } = await createOrUpdateUser({
    client,
    name: agent.name,
    pictureUrl: agent.remote_photo_url,
    tags: {
      id: agent.id,
      email: agent.email,
      role: agent.role,
    },
    discriminateByTags: ['id'],
  })

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id,
    },
  })
}
