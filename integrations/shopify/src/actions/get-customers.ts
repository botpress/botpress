import { SHOPIFY_API_VERSION } from '../const'
import { prepareParams } from '../utils'
import axios from 'axios'
import * as botpress from '.botpress'

type GetCustomers = botpress.IntegrationProps['actions']['getCustomers']

export const getCustomers: GetCustomers = async ({ ctx, input, logger }) => {
  const { ids, limit } = input
  const filters = await prepareParams({ ids, limit })

  axios.defaults.baseURL = `https://${ctx.configuration.shopName}.myshopify.com`
  axios.defaults.headers['X-Shopify-Access-Token'] = ctx.configuration.access_token

  try {
    const response = await axios.get(
      `/admin/api/${SHOPIFY_API_VERSION}/customers.json${filters.length > 0 ? '?' + filters.query : ''}`
    )

    const customers_list = response.data.customers

    logger
      .forBot()
      .info(
        `Ran 'Get Customers List' and found ${customers_list.length} customers matching criteria ${filters.query}`
      )

    return { customers_list }
  } catch (e) {
    logger.forBot().error(`'Get Customers List' exception ${JSON.stringify(e)}`)
    return { customers_list : {} }
  }
}
