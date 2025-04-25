import { buildConversationTranscript } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async (props) => {
  const { ctx, input, client } = props
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { user } = await client.getUser({
    id: input.userId,
  })
  const zendeskAuthorId = user.tags.id
  if (!zendeskAuthorId) {
    throw new sdk.RuntimeError(`User ${user.id} not linked in Zendesk`)
  }

  const ticket = await zendeskClient.createTicket(input.title ?? 'Untitled Ticket', await _buildTicketBody(props), {
    id: zendeskAuthorId,
  })

  const zendeskTicketId = `${ticket.id}`
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: zendeskTicketId,
    },
  })

  await zendeskClient.updateTicket(zendeskTicketId, {
    external_id: conversation.id,
  })

  return {
    conversationId: conversation.id,
  }
}

const _buildTicketBody = async ({ input, client, ctx }: bp.ActionProps['startHitl']) => {
  const description = input.description?.trim() || 'Someone opened a ticket using your Botpress chatbot.'

  const messageHistory = await buildConversationTranscript({ client, ctx, messages: input.messageHistory })

  return description + (messageHistory.length ? `\n\n---\n\n${messageHistory}` : '')
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
    await zendeskClient.updateTicket(ticketId, {
      status: 'closed',
    })
    return {}
  } catch (err) {
    console.error('Could not close ticket', err)
    throw new sdk.RuntimeError(`Failed to close ticket: ${err}`)
  }
}
