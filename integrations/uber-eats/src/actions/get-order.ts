import * as bp from '.botpress'
import { orderMapper } from '@/mappers/order.mapper'
import { wrapUberAction } from '@/misc/action-wrapper'

export const getOrder: bp.IntegrationProps['actions']['getOrder'] = wrapUberAction(async ({ uber, input }) => {
  const response = await uber.getOrder(input.orderId)
  return orderMapper.toGetOrderActionOutput(response.data)
}, 'Failed to fetch Uber Eats order')
