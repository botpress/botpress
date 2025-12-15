import * as bp from '.botpress'
import { wrapUberAction } from '@/misc/action-wrapper'

export const denyOrder: bp.IntegrationProps['actions']['denyOrder'] = wrapUberAction(async ({ uber, input }) => {
  return await uber.denyOrder(input.orderId, {
    deny_reason: input.reason,
  })
}, 'Failed to deny Uber Eats order')
