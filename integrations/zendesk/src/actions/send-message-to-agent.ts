import type * as botpress from '.botpress'
import type { Implementation } from '../misc/types'
import { ZendeskApi } from '../client'

type Config = botpress.configuration.Configuration

const getClient = (config: Config) => new ZendeskApi(config.baseURL, config.username, config.apiToken)

export const sendMessageToAgent: Implementation['actions']['sendMessageToAgent'] = async ({ ctx, input }) => {
  const zendeskClient = getClient(ctx.configuration)
  const ticket = await zendeskClient.updateTicket(input.ticketId, {
    comment: {
      body: input.comment,
      author_id: input.authorId,
    },
  })
  return {
    ticket,
  }
}
