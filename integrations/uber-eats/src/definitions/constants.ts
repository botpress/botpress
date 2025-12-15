import { z } from '@botpress/sdk'

export const UberUUID = z.string().uuid().describe('Uber UUID')

export const UberOrderState = z.enum(['OFFERED', 'ACCEPTED', 'HANDED_OFF', 'SUCCEEDED', 'FAILED', 'CREATED', 'UNKNOWN'])

export const UberOrderStatus = z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'UNKNOWN'])

export const UberDenyReason = z.enum([
  'ITEM_ISSUE',
  'KITCHENCLOSED',
  'CUSTOMER_CALLED_TO_CANCEL',
  'RESTAURANT_TOO_BUSY',
  'ORDER_VALIDATION',
  'STORE_CLOSED',
  'TECHNICAL_FAILURE',
  'POS_NOT_READY',
  'POS_OFFLINE',
  'CAPACITY',
  'ADDRESS',
  'SPECIAL_INSTRUCTIONS',
  'PRICING',
  'UNKNOWN',
  'OTHER',
])
