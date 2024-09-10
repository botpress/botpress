import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, input, client }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { user } = await client.getUser({
    id: input.userId,
  })

  const ticket = await zendeskClient.createTicket(input.title, input.description ?? '...', {
    name: user.name ?? 'Unknown User',
    email: user.tags.email ?? 'unknown@noemail.com',
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: `${ticket.id}`,
    },
  })

  return {
    conversationId: conversation.id,
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  const ticketId: string | undefined = conversation.tags.id
  if (!ticketId) {
    return {}
  }

  const zendeskClient = getZendeskClient(ctx.configuration)
  const originalTicket = await zendeskClient.getTicket(ticketId)

  await zendeskClient.updateTicket(ticketId, {
    comment: {
      body: input.reason,
      author_id: originalTicket.requester_id,
    },
    status: 'closed',
  })

  return {}
}
