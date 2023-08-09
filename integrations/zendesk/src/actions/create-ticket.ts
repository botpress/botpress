import type * as botpress from '.botpress'
import type { Implementation } from '../misc/types'
import { ZendeskApi } from '../client'

type Config = botpress.configuration.Configuration

const getClient = (config: Config) => new ZendeskApi(config.baseURL, config.username, config.apiToken)

export const createTicket: Implementation['actions']['createTicket'] = async ({ ctx, client, input }) => {
  const zendeskClient = getClient(ctx.configuration)
  const ticket = await zendeskClient.createTicket(input.subject, input.comment, {
    name: input.requesterName,
    email: input.requesterEmail,
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'ticket',
    tags: {
      id: ticket.id.toString(),
      authorId: ticket.requester_id.toString(),
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
    ticket, // TODO: the output doesn't match the schema, got a Zod error here
  }
}
