import { z } from '@botpress/sdk'

export const UberUUID = z.string().uuid().describe('Uber UUID')
export const UberUrl = z.string().url().describe('URL')
export const UberUnixMs = z.number().int().describe('Unix timestamp in milliseconds')

export const UberOrderState = z.enum(['OFFERED', 'ACCEPTED', 'HANDED_OFF', 'SUCCEEDED', 'FAILED', 'CREATED', 'UNKNOWN'])

export const UberOrderStatus = z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'UNKNOWN'])

export const UberDenyReason = z.enum([
  'REASON_NOT_READY',
  'REASON_OUT_OF_MENU_ITEM',
  'REASON_UNABLE_TO_FULFILL',
  'REASON_TOO_BUSY',
])

export const UberPaginationDataSchema = z.object({
  next_page_token: z
    .string()
    .optional()
    .describe('Token to retrieve the next page. Only returned if there is a next page.'),
  page_size: z.number().optional().describe('Number of orders in the response for this page'),
})

export const UberReadyOrderType = z.enum(['PICKUP', 'DELIVERY', 'UNKNOWN'])

export const UberOrderSchema = z
  .object({
    id: UberUUID.describe('Order ID').optional(),
    display_id: z.string().describe('Human-readable order id').optional(),
    external_id: z.string().describe('External order id').optional(),

    state: UberOrderState.optional(),
    status: UberOrderStatus.optional(),

    store_id: UberUUID.optional(),
    created_at: z.string().optional(),
    scheduled_order_time: z.string().optional(),

    // There are many nested objects in the spec (cart, eater, fulfillment, etc).
    // Don’t over-model until you need them.
  })
  .passthrough()
  .describe('Uber Eats order payload (partial + passthrough for forward compatibility)')

export const UberRestaurantOrderSchema = z
  .object({
    order: UberOrderSchema.optional(),
  })
  .passthrough()
  .describe('GET /v1/delivery/order/{order_id} response')

export const UberRestaurantOrdersListSchema = z
  .object({
    data: z.array(UberRestaurantOrderSchema).optional(),
    pagination_data: UberPaginationDataSchema.optional(),
  })
  .passthrough()
  .describe('GET /v1/delivery/store/{store_id}/orders response')

export const getOrderInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

export const getOrderOutputSchema = UberRestaurantOrderSchema

export const acceptOrderInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
})

export const acceptOrderOutputSchema = z.object({}).describe('Empty response on success')

export const denyOrderInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
  reason: UberDenyReason.optional().describe('Reason for denying the order'),
})

export const denyOrderOutputSchema = z.object({}).describe('Empty response on success')

export const markOrderReadyInputSchema = z.object({
  orderId: UberUUID.title('Order ID').describe('Uber order UUID'),
  orderType: UberReadyOrderType.optional().describe('PICKUP / DELIVERY / UNKNOWN'),
})

export const markOrderReadyOutputSchema = z.object({}).describe('Empty response on success')
