import * as bp from '.botpress'
import { wrapUberAction } from '@/misc/action-wrapper'

export const acceptOrder: bp.IntegrationProps['actions']['acceptOrder'] = wrapUberAction(async ({ uber, input }) => {
  return await uber.acceptOrder(input.orderId)
}, 'Failed to accept Uber Eats order')
