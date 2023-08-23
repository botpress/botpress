import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import qs from 'querystring'
import { SHOPIFY_API_VERSION } from '../const'
import { IntegrationProps } from '.botpress'

type GetCustomers = IntegrationProps['actions']['getCustomers']

export const getCustomers: GetCustomers = async ({ ctx, input, logger }) => {
  const { ids, limit } = input
  const filters = qs.stringify({ ids, limit })

  const axiosConfig = {
    baseURL: `https://${ctx.configuration.shopName}.myshopify.com`,
    headers: {
      'X-Shopify-Access-Token': ctx.configuration.access_token,
    },
  }

  try {
    const response = await axios.get(`/admin/api/${SHOPIFY_API_VERSION}/customers.json?${filters}`, axiosConfig)

    const customersList = response.data.customers

    logger
      .forBot()
      .info(`Ran 'Get Customers List' and found ${customersList.length} customers matching criteria ${filters}`)

    return { customersList }
  } catch (e) {
    const errorMsg = `'Get Customers List' exception ${JSON.stringify(e)}`
    logger.forBot().error(errorMsg)
    throw new RuntimeError(errorMsg)
  }
}
