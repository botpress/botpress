import { getZendeskClient } from '../client'
import type { Implementation } from '../misc/types'

// TODO: probably delete this action and only use the tunnel Ticket channel
export const sendMessageToAgent: Implementation['actions']['sendMessageToAgent'] = async ({ ctx, client, input }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)
  console.log('Updating ticket: ', input.ticketId)
  const ticket = await zendeskClient.getTicket(input.ticketId)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: {
      id: ticket.id.toString(),
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: ticket.requester_id.toString(),
    },
  })

  await client.createMessage({
    tags: { origin: 'botpress' }, // TODO: is it needed to have an ID?
    type: 'text',
    userId: user.id,
    conversationId: conversation.id,
    payload: { text: input.comment },
  })

  console.log('result:', ticket)
  return {
    ticket,
  }
}
