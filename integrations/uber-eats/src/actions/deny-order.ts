import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

export const denyOrder: bp.IntegrationProps['actions']['denyOrder'] = wrapUberAction(async ({ uber, input }) => {
  return await uber.denyOrder(input.orderId, {
    deny_reason: {
      type: input.reason.type,
      info: input.reason.info,
      client_error_code: input.reason.clientErrorCode,
    },
  })
}, 'Failed to deny Uber Eats order')
