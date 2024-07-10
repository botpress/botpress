import * as sdk from '@botpress/sdk'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const openTicket: bp.IntegrationProps['actions']['openTicket'] = async ({ ctx, client: bpClient, input }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { userId, title, description } = input

  const { user } = await bpClient.getUser({ id: userId })
  if (!user.tags.id) {
    throw new sdk.RuntimeError('User is not linked to a Zendesk user')
  }

  const ticket = await zendeskClient.createTicket(title, description ?? '...', {
    id: user.tags.id,
  })

  const { conversation } = await bpClient.createConversation({
    channel: 'ticket',
    tags: {
      id: `${ticket.id}`,
    },
  })

  return {
    conversationId: conversation.id,
  }
}
