import type * as botpress from '.botpress'
import type { Implementation } from '../misc/types'
import { ZendeskApi } from '../client'

type Config = botpress.configuration.Configuration

const getClient = (config: Config) => new ZendeskApi(config.baseURL, config.username, config.apiToken)

export const closeTicket: Implementation['actions']['closeTicket'] = async ({ ctx, input }) => {
  const zendeskClient = getClient(ctx.configuration)
  const ticket = await zendeskClient.updateTicket(input.ticketId, {
    comment: input.comment,
    status: 'closed',
    author_id: input.authorId, // TODO: use state for this.. don't need to pass all this shit
  })
  return {
    ticket,
  }
}
