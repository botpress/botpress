import * as bp from '../../.botpress'
import { getOrder } from './get-order'
import { getProduct } from './get-product'
import { listCustomerOrders } from './list-customer-orders'
import { listProducts } from './list-products'
import { searchCustomers } from './search-customers'

export default {
  listProducts,
  getProduct,
  searchCustomers,
  getOrder,
  listCustomerOrders,
} satisfies bp.IntegrationProps['actions']
