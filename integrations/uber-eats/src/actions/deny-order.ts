import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

export const denyOrder: bp.IntegrationProps['actions']['denyOrder'] = wrapUberAction(async ({ uber, input }) => {
  return await uber.denyOrder(input.orderId, input.reason)
}, 'Failed to deny Uber Eats order')
