import { transformTicket } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import { IntegrationProps } from '.botpress'

export const createTicket: IntegrationProps['actions']['createTicket'] = async ({ ctx, client, input }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)
  const ticket = await zendeskClient.createTicket(input.subject, input.comment, {
    name: input.requesterName,
    email: input.requesterEmail,
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: {
      id: ticket.id.toString(),
      originConversationId: input.__conversationId,
    },
  })

  await zendeskClient.updateTicket(ticket.id, {
    external_id: conversation.id,
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: ticket.requester_id.toString(),
      origin: 'botpress',
    },
  })

  await zendeskClient.updateUser(ticket.requester_id, {
    external_id: user.id,
  })

  return {
    ticket: transformTicket(ticket),
    conversationId: conversation.id,
    userId: user.id,
  }
}
