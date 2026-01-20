import { transformUser } from 'src/definitions/schemas'
import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const findCustomer: bp.IntegrationProps['actions']['findCustomer'] = async (props) => {
  const { client: bpClient, ctx, input, logger } = props
  const zendeskClient = await getZendeskClient(bpClient, ctx, logger)
  const customers = await zendeskClient.findCustomers(input.query)
  return { customers: customers.map(transformUser) }
}
