import { getZendeskClient } from '../client'
import type { Implementation } from '../misc/types'

export const createTicket: Implementation['actions']['createTicket'] = async ({ ctx, client, input }) => {
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

  await client.createMessage({
    tags: { origin: 'botpress' }, // TODO: is it needed to have an ID?
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: input.comment },
  })

  console.log('Ticket created: ', ticket, ctx)
  return {
    ticket,
    conversationId: conversation.id,
    userId: user.id, // TODO: the output doesn't match the schema, got a Zod error here
  }
}
