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

  const messageHistory = (
    await Promise.all(
      input.messageHistory
        // NOTE: currently, the hitl plugin only supports text messages
        ?.filter((message) => message.type === 'text')
        .map(async (message) => {
          const { payload, source } = message
          const user = await _getBotpressUser({
            userId: source.type === 'user' ? source.userId : ctx.botUserId,
            client,
          })
          const userTags = user.tags as Record<string, string>
          const author = userTags['name'] ?? user.name ?? (source.type === 'bot' ? 'Botpress' : 'Unknown User')
          const authorIcon = source.type === 'bot' ? '🤖' : '👤'

          return `${authorIcon} ${author}:\n> ${payload.text}`
        }) ?? []
    )
  ).join('\n\n---\n\n')

  return description + (messageHistory.length ? `\n\n---\n\n${messageHistory}` : '')
}

type User = bp.ClientResponses['getUser']['user']
const _USERS_CACHE = new Map<string, User>()

const _getBotpressUser = async ({ userId, client }: { userId: string; client: bp.Client }): Promise<User> => {
  const cachedUser = _USERS_CACHE.get(userId)

  if (cachedUser) {
    return cachedUser
  }

  const { user } = await client.getUser({ id: userId })
  _USERS_CACHE.set(userId, user)

  return user
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
