import * as bp from '.botpress'
import type { DenyReason } from '@/gen/api'
import { wrapUberAction } from '@/misc/action-wrapper'

export const denyOrder: bp.IntegrationProps['actions']['denyOrder'] = wrapUberAction(async ({ uber, input }) => {
  const reason: DenyReason = {
    type: input.reason.type,
    info: input.reason.info,
    client_error_code: input.reason.clientErrorCode,
  }

  return await uber.denyOrder(input.orderId, {
    deny_reason: reason,
  })
}, 'Failed to deny Uber Eats order')
