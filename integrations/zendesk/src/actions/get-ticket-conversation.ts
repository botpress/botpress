import { getZendeskClient } from 'src/client'
import { IntegrationProps } from '.botpress'

type ZendeskClient = ReturnType<typeof getZendeskClient>

const ticketExists = async (client: ZendeskClient, ticketId: string) => {
  try {
    await client.getTicket(ticketId)
    return true
  } catch (e) {
    return false
  }
}

export const getTicketConversation: IntegrationProps['actions']['getTicketConversation'] = async ({
  input,
  client,
  ctx,
}) => {
  const zendeskClient = getZendeskClient(ctx.configuration)
  const exists = await ticketExists(zendeskClient, input.ticketId)
  if (!exists) {
    throw new Error(`Ticket ${input.ticketId} does not exist`)
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: {
      'zendesk:id': input.ticketId,
    },
  })

  return {
    conversationId: conversation.id,
    tags: conversation.tags,
  }
}
