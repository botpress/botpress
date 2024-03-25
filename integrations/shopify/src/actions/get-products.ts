import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import qs from 'querystring'
import { SHOPIFY_API_VERSION } from '../const'
import { IntegrationProps } from '.botpress'

type GetProductVariants = IntegrationProps['actions']['getProducts']

export const getProducts: GetProductVariants = async ({ ctx, input, logger }) => {
  const { ids, limit, product_type, title } = input
  const filters = qs.stringify({ ids, limit, product_type, title })

  const axiosConfig = {
    baseURL: `https://${ctx.configuration.shopName}.myshopify.com`,
    headers: {
      'X-Shopify-Access-Token': ctx.configuration.access_token,
    },
  }

  try {
    const response = await axios.get(`/admin/api/${SHOPIFY_API_VERSION}/products.json?${filters}`, axiosConfig)

    const productsList = response.data.products

    logger
      .forBot()
      .info(`Ran 'Get Products List' and found ${productsList.length} products matching criteria ${filters}`)

    return { productsList }
  } catch (e) {
    const errorMsg = `'Get Products List' exception ${JSON.stringify(e)}`
    logger.forBot().error(errorMsg)
    throw new RuntimeError(errorMsg)
  }
}
