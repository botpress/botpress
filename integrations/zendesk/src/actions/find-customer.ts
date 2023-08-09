import { getZendeskClient } from '../client'
import type { Implementation } from '../misc/types'

export const findCustomer: Implementation['actions']['findCustomer'] = async ({ ctx, input }) => {
  return getZendeskClient(ctx.configuration).findCustomers(input.query)
}
