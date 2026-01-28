import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

export const markOrderReady: bp.IntegrationProps['actions']['markOrderReady'] = wrapUberAction(
  async ({ uber, input }) => {
    return await uber.markOrderReady(input.orderId)
  },
  'Failed to mark order as ready'
)
