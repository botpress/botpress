import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

export const acceptOrder: bp.IntegrationProps['actions']['acceptOrder'] = wrapUberAction(async ({ uber, input }) => {
  return await uber.acceptOrder(input.orderId)
}, 'Failed to accept Uber Eats order')
