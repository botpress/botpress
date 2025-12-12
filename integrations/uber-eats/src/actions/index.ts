import { acceptOrder } from './accept-order'
import { denyOrder } from './deny-order'
import { getOrder } from './get-order'
import { listStoreOrders } from './list-store-orders'
import { markOrderReady } from './make-order-ready'

export const actions = {
  getOrder,
  listStoreOrders,
  acceptOrder,
  denyOrder,
  markOrderReady,
}
