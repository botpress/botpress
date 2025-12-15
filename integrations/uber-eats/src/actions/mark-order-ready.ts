import * as bp from '.botpress'
import { wrapUberAction } from '@/misc/action-wrapper'

export const markOrderReady: bp.IntegrationProps['actions']['markOrderReady'] = wrapUberAction(
  async ({ uber, input }) => {
    return await uber.markOrderReady(input.orderId)
  },
  'Failed to mark order as ready'
)
