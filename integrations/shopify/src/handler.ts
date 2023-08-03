import * as botpress from '.botpress'
import { fireOrderCreated } from './events/orderCreated'
import { fireOrderCancelled } from './events/orderCancelled'
import { fireNewCustomer } from './events/newCustomer'

export const handler: botpress.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  if ((req.headers['x-shopify-topic'] == 'orders/create')) return fireOrderCreated({ req, client, ctx, logger })
  
  if ((req.headers['x-shopify-topic'] == 'orders/cancelled')) return fireOrderCancelled({ req, client, ctx, logger })
  
  if ((req.headers['x-shopify-topic'] == 'customers/create')) return fireNewCustomer({ req, client, ctx, logger })
}
