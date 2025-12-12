import { z } from '@botpress/sdk'

export const UberUUID = z.string().uuid().describe('Uber UUID')

export const UberOrderState = z.enum(['OFFERED', 'ACCEPTED', 'HANDED_OFF', 'SUCCEEDED', 'FAILED', 'CREATED', 'UNKNOWN'])

export const UberOrderStatus = z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'UNKNOWN'])

export const UberDenyReason = z.enum([
  'REASON_NOT_READY',
  'REASON_OUT_OF_MENU_ITEM',
  'REASON_UNABLE_TO_FULFILL',
  'REASON_TOO_BUSY',
])

export const UberReadyOrderType = z.enum(['PICKUP', 'DELIVERY', 'UNKNOWN'])
