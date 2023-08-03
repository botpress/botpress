import { SHOPIFY_API_VERSION } from '../const'
import { prepareParams } from '../utils'
import axios from 'axios'
import * as botpress from '.botpress'

type GetProductVariants = botpress.IntegrationProps['actions']['getProductVariants']

export const getProductVariants: GetProductVariants = async ({ ctx, input, logger }) => {
  const { product_id, limit } = input
  const filters = await prepareParams({ product_id, limit })

  axios.defaults.baseURL = `https://${ctx.configuration.shopName}.myshopify.com`
  axios.defaults.headers['X-Shopify-Access-Token'] = ctx.configuration.access_token

  try {
    const response = await axios.get(
      `/admin/api/${SHOPIFY_API_VERSION}/variants.json${filters.length > 0 ? '?' + filters.query : ''}`
    )

    const product_variants_list = response.data.variants

    logger
      .forBot()
      .info(
        `Ran 'Get Product Variants List' and found ${product_variants_list.length} product variants matching criteria ${filters.query}`
      )

    return { product_variants_list }
  } catch (e) {
    logger.forBot().error(`'Get Product Variants List' exception ${JSON.stringify(e)}`)
    return { product_variants_list: {} }
  }
}
