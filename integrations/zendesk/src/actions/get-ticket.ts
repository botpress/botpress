import type * as botpress from '.botpress'
import type { Implementation } from '../misc/types'
import { ZendeskApi } from '../client'

type Config = botpress.configuration.Configuration

const getClient = (config: Config) => new ZendeskApi(config.baseURL, config.username, config.apiToken)

export const getTicket: Implementation['actions']['getTicket'] = async ({ ctx, input }) => {
  const zendeskClient = getClient(ctx.configuration)
  const ticket = await zendeskClient.getTicket(input.ticketId)
  return {
    ticket: ticket,
  }
}
