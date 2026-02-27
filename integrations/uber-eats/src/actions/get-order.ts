import { orderMapper } from 'src/mappers/order.mapper'
import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

export const getOrder: bp.IntegrationProps['actions']['getOrder'] = wrapUberAction(async ({ uber, input }) => {
  const response = await uber.getOrder(input.orderId)
  return orderMapper.toGetOrderActionOutput(response.data)
}, 'Failed to fetch Uber Eats order')
