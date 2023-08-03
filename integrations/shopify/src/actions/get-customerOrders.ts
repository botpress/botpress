import { SHOPIFY_API_VERSION } from '../const'
import { prepareParams } from '../utils'
import axios from 'axios'
import * as botpress from '.botpress'

type GetCustomerOrders = botpress.IntegrationProps['actions']['getCustomerOrders']

export const getCustomerOrders: GetCustomerOrders = async ({ ctx, input, logger }) => {
  const { customer_id, status } = input
  const filters = await prepareParams({ customer_id, status })

  axios.defaults.baseURL = `https://${ctx.configuration.shopName}.myshopify.com`
  axios.defaults.headers['X-Shopify-Access-Token'] = ctx.configuration.access_token

  try {
    const response = await axios.get(
      `/admin/api/${SHOPIFY_API_VERSION}/orders.json${filters.length > 0 ? '?' + filters.query : ''}`
    )

    const customerOrders_list = response.data.orders

    logger
      .forBot()
      .info(
        `Ran 'Get Customer Orders List' and found ${customerOrders_list.length} customer orders matching criteria ${filters.query}`
      )

    return { customerOrders_list }
  } catch (e) {
    logger.forBot().error(`'Get Customer Orders List' exception ${JSON.stringify(e)}`)
    return { customerOrders_list: {} }
  }
}
