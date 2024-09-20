import { transformUser } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const findCustomer: bp.IntegrationProps['actions']['findCustomer'] = async ({ ctx, input }) => {
  const customers = await getZendeskClient(ctx.configuration).findCustomers(input.query)
  return { customers: customers.map(transformUser) }
}
