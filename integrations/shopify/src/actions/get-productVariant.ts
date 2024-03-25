import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import qs from 'querystring'
import { SHOPIFY_API_VERSION } from '../const'
import { IntegrationProps } from '.botpress'

type GetProductVariants = IntegrationProps['actions']['getProductVariants']

export const getProductVariants: GetProductVariants = async ({ ctx, input, logger }) => {
  const { product_id, limit } = input
  const filters = qs.stringify({ product_id, limit })

  const axiosConfig = {
    baseURL: `https://${ctx.configuration.shopName}.myshopify.com`,
    headers: {
      'X-Shopify-Access-Token': ctx.configuration.access_token,
    },
  }

  try {
    const response = await axios.get(`/admin/api/${SHOPIFY_API_VERSION}/variants.json?${filters}`, axiosConfig)

    const productVariantsList = response.data.variants

    logger
      .forBot()
      .info(
        `Ran 'Get Product Variants List' and found ${productVariantsList.length} product variants matching criteria ${filters}`
      )

    return { productVariantsList }
  } catch (e) {
    const errorMsg = `'Get Product Variants List' exception ${JSON.stringify(e)}`
    logger.forBot().error(errorMsg)
    throw new RuntimeError(errorMsg)
  }
}
