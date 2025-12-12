import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

export const getOrder: bp.IntegrationProps['actions']['getOrder'] = wrapUberAction(async ({ uber, input }) => {
  return await uber.getOrder(input.orderId)
}, 'Failed to fetch Uber Eats order')
