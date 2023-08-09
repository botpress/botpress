import { getZendeskClient } from '../client'
import type { Implementation } from '../misc/types'

export const findCustomer: Implementation['actions']['findCustomer'] = async ({ ctx, input }) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  return { customers: await zendeskClient.findCustomers(input.query) }
}
