import { createOrUpdateUser } from '@botpress/common'
import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const executeTicketAssigned = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
}) => {
  const { ticketId, agent } = zendeskTrigger

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: ticketId,
    },
  })

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
