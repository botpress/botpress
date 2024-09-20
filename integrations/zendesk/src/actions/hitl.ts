import * as sdk from '@botpress/sdk'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, input, client }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { user } = await client.getUser({
    id: input.userId,
  })
  const zendeskAuthorId = user.tags.id
  if (!zendeskAuthorId) {
    throw new sdk.RuntimeError(`User ${user.id} not linked in Zendesk`)
  }

  const ticket = await zendeskClient.createTicket(
    input.title ?? 'Untitled Ticket',
    input.description ?? 'Someone opened a ticket using your Botpress chatbot',
    { id: zendeskAuthorId }
  )

  const zendeskTicketId = `${ticket.id}`
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: zendeskTicketId,
    },
  })

  // TODO: possibly display the message history

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

  try {
    const originalTicket = await zendeskClient.getTicket(ticketId)
    await zendeskClient.updateTicket(ticketId, {
      comment: {
        body: input.reason,
        author_id: originalTicket.requester_id,
      },
      status: 'closed',
    })
    return {}
  } catch (err) {
    console.error('Could not close ticket', err)
    throw new sdk.RuntimeError(`Failed to close ticket: ${err}`)
  }
}
