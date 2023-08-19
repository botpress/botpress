import { IntegrationProps } from '.botpress'

export const startTicketConversation: IntegrationProps['actions']['startTicketConversation'] = async ({
  input,
  client,
}) => {
  // TODO: ensure the ticket already exists

  const { conversation } = await client.createConversation({
    channel: 'ticket',
    tags: {
      'zendesk:id': input.ticketId,
    },
  })

  return {
    conversationId: conversation.id,
  }
}
