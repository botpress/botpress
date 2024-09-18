import * as sdk from '@botpress/sdk'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

type User = bp.ClientResponses['getUser']['user']
type MessageHistoryElement = NonNullable<bp.actions.startHitl.input.Input['messageHistory']>[number]

const toText = (el: MessageHistoryElement): string => {
  switch (el.type) {
    case 'text':
      return el.payload.text
    case 'markdown':
      return el.payload.markdown
    case 'image':
      return `image: ${el.payload.imageUrl}`
    case 'audio':
      return `audio: ${el.payload.audioUrl}`
    case 'video':
      return `video: ${el.payload.videoUrl}`
    case 'file':
      return `file: ${el.payload.fileUrl}`
    case 'location':
      return `location: ${el.payload.latitude},${el.payload.longitude}`
    case 'carousel':
      return 'carousel'
    case 'card':
      return 'card'
    case 'dropdown':
      return 'dropdown'
    case 'choice':
      return `choice: ${el.payload.options.map((o) => `\n- ${o.value}`)}`
    case 'bloc':
      return 'bloc'
    default:
      throw new sdk.RuntimeError(`Unsupported message type: ${(el as any).type}`)
  }
}

class UserFinder {
  private _users: Record<string, User> = {}
  public constructor(private _client: bp.Client) {}

  public async findUser(userId: string): Promise<User | undefined> {
    if (this._users[userId]) {
      return this._users[userId]
    }

    try {
      const { user } = await this._client.getUser({ id: userId })
      this._users[userId] = user
      return user
    } catch (thrown) {
      if (sdk.isApiError(thrown) && thrown.type === 'ResourceNotFound') {
        return undefined
      }
      throw thrown
    }
  }
}

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, input, client }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { user } = await client.getUser({
    id: input.userId,
  })
  const zendeskAuthorId = user.tags.id
  if (!zendeskAuthorId) {
    throw new sdk.RuntimeError(`User ${user.id} not linked in Zendesk`)
  }

  try {
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

    const users = new UserFinder(client)

    for (const message of input.messageHistory ?? []) {
      const userId = message.source.type === 'user' ? message.source.userId : ctx.botUserId
      const user = await users.findUser(userId)
      if (!user) {
        throw new sdk.RuntimeError(`User ${userId} not found`)
      }

      const zendeskAuthorId = user.tags.id
      if (!zendeskAuthorId) {
        throw new sdk.RuntimeError(`User ${userId} not linked in Zendesk`)
      }

      await zendeskClient.createComment(zendeskTicketId, zendeskAuthorId, toText(message))
    }

    return {
      conversationId: conversation.id,
    }
  } catch (err) {
    console.error(err)
    throw new sdk.RuntimeError(`Failed to create ticket: ${err}`)
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
  const originalTicket = await zendeskClient.getTicket(ticketId)

  try {
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
