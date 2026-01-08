import { transformUser } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const findCustomer: bp.IntegrationProps['actions']['findCustomer'] = async ({
  client: bpClient,
  ctx,
  input,
}) => {
  const zendeskClient = await getZendeskClient(bpClient, ctx)
  const customers = await zendeskClient.findCustomers(input.query)
  return { customers: customers.map(transformUser) }
}
