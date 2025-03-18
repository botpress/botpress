import callApi from './call-api'
import getProduct from './get-product'
import syncProducts from './sync-products'
import * as bp from '.botpress'

export default {
  getProduct,
  callApi,
  syncProducts,
} satisfies bp.IntegrationProps['actions']
