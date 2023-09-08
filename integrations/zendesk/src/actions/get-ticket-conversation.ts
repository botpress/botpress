import { IntegrationProps } from '.botpress'

export const getTicketConversation: IntegrationProps['actions']['getTicketConversation'] = async ({
  input,
  client,
}) => {
  // TODO: ensure the ticket already exists

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
