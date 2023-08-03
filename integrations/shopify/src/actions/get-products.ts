import { SHOPIFY_API_VERSION } from '../const'
import { prepareParams } from '../utils'
import axios from 'axios'
import * as botpress from '.botpress'

type GetProductVariants = botpress.IntegrationProps['actions']['getProducts']

export const getProducts: GetProductVariants = async ({ ctx, input, logger }) => {
  const { ids, limit, product_type, title } = input
  const filters = await prepareParams({ ids, limit, product_type, title })

  axios.defaults.baseURL = `https://${ctx.configuration.shopName}.myshopify.com`
  axios.defaults.headers['X-Shopify-Access-Token'] = ctx.configuration.access_token

  try {
    const response = await axios.get(
      `/admin/api/${SHOPIFY_API_VERSION}/products.json${filters.length > 0 ? '?' + filters.query : ''}`
    )

    const products_list = response.data.products

    logger
      .forBot()
      .info(`Ran 'Get Products List' and found ${products_list.length} products matching criteria ${filters.query}`)

    return { products_list }
  } catch (e) {
    logger.forBot().error(`'Get Products List' exception ${JSON.stringify(e)}`)
    return { products_list: {} }
  }
}
